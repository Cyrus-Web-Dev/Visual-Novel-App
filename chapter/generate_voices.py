import glob
import json
import os
import time
import requests

# === KONFIGURASI ===
VOICEVOX_URL = "http://127.0.0.1:50021"
OUTPUT_FOLDER = "audio/voice"
JP_MAP_FILE = "voice_jp_map.json"

# Timeout lebih panjang (detik)
QUERY_TIMEOUT = 60
SYNTH_TIMEOUT = 180   # synthesis bisa lama saat pertama kali
MAX_RETRY = 3
RETRY_DELAY = 5

# True = generate ulang meski file sudah ada (pakai setelah ubah SPEED_SCALE)
FORCE_REGENERATE = False

# VoiceVox prosody — kecepatan PER KARAKTER (tidak disamaratakan)
# speedScale > 1.0 = lebih cepat. Diuji agar tidak lambat/terlalu cepat/mengeja.
# Ichika (あまあま) cenderung lambat → naikkan; Miku cenderung cepat → turunkan.
SPEED_MAP = {
    "Suzuki Ichika": 1.34,            # soft/slow base → percepat
    "Tachibana Nino": 1.28,           # tsundere, netral-cepat
    "Yoshikawa Miku": 1.16,           # cenderung cepat → pelankan
    "Takahashi Yotsuba": 1.07,        # energetic
    "Watanabe Itsuki": 1.04,          # formal, sedikit lebih pelan
    "Semua Cewek (Bersamaan)": 1.28,
}
DEFAULT_SPEED = 1.28
INTONATION_SCALE = 1.15
VOLUME_SCALE = 1.55
PITCH_SCALE = 0.0
PRE_PHONEME_LENGTH = 0.08
POST_PHONEME_LENGTH = 0.12

# Mapping ID Speaker (sudah dicek cocok dengan /speakers kamu)
SPEAKER_MAP = {
    "Suzuki Ichika": 15,          # 九州そら あまあま
    "Tachibana Nino": 6,          # 四国めたん ツンツン
    "Yoshikawa Miku": 46,         # 小夜/SAYO ノーマル
    "Takahashi Yotsuba": 8,       # 春日部つむぎ ノーマル
    "Watanabe Itsuki": 74,        # 琴詠ニア ノーマル
    "Semua Cewek (Bersamaan)": 15,
}


def load_jp_map():
    if not os.path.exists(JP_MAP_FILE):
        print(f"[ERROR] File {JP_MAP_FILE} tidak ditemukan!")
        return {}
    with open(JP_MAP_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def check_engine():
    """Cek apakah engine hidup."""
    try:
        r = requests.get(f"{VOICEVOX_URL}/version", timeout=10)
        if r.status_code == 200:
            print(f"[OK] VoiceVox Engine version: {r.text.strip()}")
            return True
    except Exception as e:
        print(f"[ERROR] Engine tidak merespons: {e}")
    return False


def warmup():
    """Warm-up: generate 1 suara pendek supaya model ter-load."""
    print("\n[Warm-up] Loading model (bisa 30-90 detik pertama kali)...")
    try:
        q = requests.post(
            f"{VOICEVOX_URL}/audio_query",
            params={"text": "こんにちは", "speaker": 3},
            timeout=QUERY_TIMEOUT,
        )
        if q.status_code != 200:
            print(f"  Warm-up query gagal: {q.status_code}")
            return False
        s = requests.post(
            f"{VOICEVOX_URL}/synthesis",
            params={"speaker": 3},
            json=q.json(),
            timeout=SYNTH_TIMEOUT,
        )
        if s.status_code == 200:
            print("  ✓ Warm-up berhasil, engine siap!")
            return True
        print(f"  Warm-up synth gagal: {s.status_code}")
        return False
    except Exception as e:
        print(f"  Warm-up exception: {e}")
        return False


def generate_audio(text, output_path, speaker_id, speed_scale=None):
    for attempt in range(1, MAX_RETRY + 1):
        try:
            # 1. Audio Query
            query_res = requests.post(
                f"{VOICEVOX_URL}/audio_query",
                params={"text": text, "speaker": speaker_id},
                timeout=QUERY_TIMEOUT,
            )
            if query_res.status_code != 200:
                print(f"  [Query Error] status={query_res.status_code}")
                if attempt < MAX_RETRY:
                    time.sleep(RETRY_DELAY)
                    continue
                return False

            # Sesuaikan prosody agar bicara lebih cepat, hidup, tidak kaku
            query = query_res.json()
            query["speedScale"] = speed_scale if speed_scale is not None else DEFAULT_SPEED
            query["intonationScale"] = INTONATION_SCALE
            query["volumeScale"] = VOLUME_SCALE
            query["pitchScale"] = PITCH_SCALE
            query["prePhonemeLength"] = PRE_PHONEME_LENGTH
            query["postPhonemeLength"] = POST_PHONEME_LENGTH

            # 2. Synthesis
            synth_res = requests.post(
                f"{VOICEVOX_URL}/synthesis",
                params={"speaker": speaker_id},
                json=query,
                timeout=SYNTH_TIMEOUT,
            )
            if synth_res.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(synth_res.content)
                return True
            else:
                print(f"  [Synth Error] status={synth_res.status_code}")
                if attempt < MAX_RETRY:
                    time.sleep(RETRY_DELAY)
                    continue
                return False

        except requests.exceptions.Timeout:
            print(f"  [Timeout] attempt {attempt}/{MAX_RETRY} ... tunggu {RETRY_DELAY}s")
            if attempt < MAX_RETRY:
                time.sleep(RETRY_DELAY)
                continue
            return False
        except Exception as e:
            print(f"  [Exception] {e}")
            if attempt < MAX_RETRY:
                time.sleep(RETRY_DELAY)
                continue
            return False
    return False


def process_all_chapters():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    print("=" * 50)
    print("  CEK ENGINE")
    print("=" * 50)
    if not check_engine():
        print("\nPastikan aplikasi VOICEVOX sudah dibuka dan engine running.")
        print("Coba buka http://127.0.0.1:50021/docs di browser.")
        return

    # Warm-up dulu (penting!)
    if not warmup():
        print("\n[WARNING] Warm-up gagal. Tetap lanjut, tapi mungkin lambat/timeout.")
        print("Kalau sering gagal, tutup & buka ulang VOICEVOX, lalu coba lagi.")

    jp_map = load_jp_map()
    if not jp_map:
        return

    # chapter1-7 + extra1-5 (after-story per cewek)
    json_files = sorted(set(glob.glob("chapter*.json") + glob.glob("extra*.json")))
    total_ok = 0
    total_skip = 0
    total_fail = 0
    missing_jp = []

    for json_file in sorted(json_files):
        print(f"\n{'='*50}")
        print(f"  MEMPROSES: {json_file}")
        print(f"{'='*50}")

        with open(json_file, "r", encoding="utf-8") as f:
            dialogue_data = json.load(f)

        for item in dialogue_data:
            voice_filename = item.get("voice", "")
            speaker_name = item.get("speaker", "")
            text_indo = item.get("text", "")

            if not voice_filename or not text_indo:
                continue

            clean_filename = voice_filename.replace(".mp3", ".wav")
            file_path = os.path.join(OUTPUT_FOLDER, clean_filename)

            if os.path.exists(file_path) and not FORCE_REGENERATE:
                print(f"[Skip] {clean_filename}")
                total_skip += 1
                continue

            text_jp = jp_map.get(voice_filename) or jp_map.get(clean_filename)
            if not text_jp:
                print(f"[MISSING JP] {voice_filename}")
                missing_jp.append(voice_filename)
                total_fail += 1
                continue

            speaker_id = SPEAKER_MAP.get(speaker_name, 3)
            speed = SPEED_MAP.get(speaker_name, DEFAULT_SPEED)

            print(f"\nGenerating [{speaker_name}] id={speaker_id} speed={speed} → {clean_filename}")
            print(f"  JP: {text_jp[:65]}...")

            success = generate_audio(text_jp, file_path, speaker_id, speed)
            if success:
                size_kb = os.path.getsize(file_path) / 1024
                print(f"  ✓ Selesai ({size_kb:.1f} KB)")
                total_ok += 1
            else:
                print(f"  ✗ Gagal setelah {MAX_RETRY}x coba")
                total_fail += 1

            # jeda kecil biar engine tidak kewalahan
            time.sleep(0.5)

    print(f"\n{'='*50}")
    print("  RINGKASAN")
    print(f"{'='*50}")
    print(f"Berhasil : {total_ok}")
    print(f"Skip     : {total_skip}")
    print(f"Gagal    : {total_fail}")

    if missing_jp:
        print("\nVoice tanpa terjemahan Jepang:")
        for v in sorted(set(missing_jp)):
            print(f"  - {v}")


if __name__ == "__main__":
    process_all_chapters()
