import sys
import json
from sentence_transformers import SentenceTransformer

# ✅ Load mô hình một lần để tăng tốc
try:
    model = SentenceTransformer("intfloat/multilingual-e5-large-instruct")
except Exception as e:
    print(json.dumps({"error": f"❌ Model loading error: {str(e)}"}))
    sys.exit(1)

def get_embedding(text_list):
    """Tạo embeddings cho danh sách văn bản"""
    if isinstance(text_list, str):
        text_list = [text_list]

    try:
        embeddings = model.encode(text_list, normalize_embeddings=True).tolist()
        return embeddings
    except Exception as e:
        return {"error": f"❌ Embedding error: {str(e)}"}

if __name__ == "__main__":
    try:
        # 🔹 Đọc dữ liệu từ stdin
        input_text = sys.stdin.read().strip()

        # 🔹 Kiểm tra đầu vào rỗng
        if not input_text:
            raise ValueError("⚠️ Không có dữ liệu đầu vào!")

        # 🔹 Parse JSON từ stdin
        text_list = json.loads(input_text)
        if not isinstance(text_list, list) or len(text_list) == 0:
            raise ValueError("⚠️ Input phải là danh sách văn bản hợp lệ!")

        # 🔹 Gọi hàm embedding
        result = get_embedding(text_list)

        # 🔹 Xuất JSON kết quả
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))  # ✅ Xuất lỗi dưới dạng JSON hợp lệ
