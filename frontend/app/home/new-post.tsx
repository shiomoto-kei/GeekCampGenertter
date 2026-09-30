"use client";

type NewPostProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NewPost({ isOpen, onClose }: NewPostProps) {
  // 開いていない時は何も表示しない
  if (!isOpen) return null;

  return (
    <>
      {/* 外側の半透明背景（クリックで閉じる） */}
      <div className="modal-overlay" onClick={onClose}>
        {/* モーダル本体（クリックしても閉じないようにする） */}
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
          {/* タイトル枠 */}
          <div className="modal-title-wrapper">
            <span className="modal-title-dots-right"></span>
            <h2 className="modal-title">新規投稿</h2>
          </div>

          {/* 年齢入力 */}
          <div className="modal-age">
            <span>年齢：</span>
            <input type="text" className="age-input" />
          </div>

          {/* テキストエリア */}
          <textarea className="modal-textarea"></textarea>

          {/* AI書き換えボタン */}
          <div className="ai-button-area">
            <button type="button" className="ai-button">
              AIに読み込ませて、<br />書き換える！
            </button>
          </div>

          {/* ハッシュタグ入力 */}
          <input 
            type="text" 
            className="hashtag-input" 
            placeholder="ハッシュタグを追加してね" 
          />

          {/* 投稿ボタン */}
          <div className="submit-area">
            <button type="button" className="submit-button">投稿！</button>
          </div>

        </div>
      </div>

      <style jsx>{`
        /* =========================
           新規投稿モーダル
           ========================= */
        .modal-overlay {
          position: fixed;
          /* ★ヘッダー(90px)とフッター(70px)にかぶらないように範囲を限定 */
          top: 80px;
          bottom: 70px;
          left: 0;
          right: 0;
          
          background-color: rgba(255, 255, 255, 0.85);
          z-index: 2000;
          
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          width: 80%;
          max-width: 320px;
          background-color: #ffffff;
          border: 2px solid #299d48;
          border-radius: 20px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .modal-title-wrapper {
          position: relative;
          border: 1px solid #cccccc;
          border-radius: 6px;
          padding: 8px 0;
          text-align: center;
          margin: 0 auto 4px;
          width: 80%;
        }

        .modal-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }

        .modal-title-wrapper::before,
        .modal-title-wrapper::after {
          content: "";
          position: absolute;
          left: 6px;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .modal-title-wrapper::before { top: 6px; }
        .modal-title-wrapper::after { bottom: 6px; }

        .modal-title-dots-right::before,
        .modal-title-dots-right::after {
          content: "";
          position: absolute;
          right: 6px;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .modal-title-dots-right::before { top: 6px; }
        .modal-title-dots-right::after { bottom: 6px; }

        .modal-age {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: #333;
        }

        .age-input {
          width: 45px;
          height: 22px;
          border: 1px solid #727272;
          border-radius: 6px;
          text-align: center;
          outline: none;
        }

        .modal-textarea {
          width: 100%;
          height: 120px;
          border: 1px solid #cccccc;
          border-radius: 12px;
          padding: 10px;
          box-sizing: border-box;
          resize: none;
          outline: none;
          font-size: 14px;
        }

        .ai-button-area {
          display: flex;
          justify-content: flex-end;
        }

        .ai-button {
          background-color: #a7dcf3;
          color: #333;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 10px;
          line-height: 1.3;
          cursor: pointer;
        }

        .hashtag-input {
          width: 100%;
          height: 32px;
          border: 1px solid #cccccc;
          border-radius: 16px;
          padding: 0 16px;
          box-sizing: border-box;
          font-size: 12px;
          outline: none;
        }

        .submit-area {
          display: flex;
          justify-content: center;
          margin-top: 4px;
        }

        .submit-button {
          background-color: #aee68c;
          color: #333;
          border: none;
          border-radius: 8px;
          padding: 8px 32px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}