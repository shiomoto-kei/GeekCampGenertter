"use client";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
          {/* タイトル枠 */}
          <div className="modal-title-wrapper">
            <span className="modal-title-dots-right"></span>
            <h2 className="modal-title">プロフィール</h2>
          </div>

          {/* アイコンと性別・年齢 */}
          <div className="profile-edit-top">
            <div className="edit-icon"></div>
            <div className="edit-inputs">
              <label>
                性別：<input type="text" className="small-input" />
              </label>
              <label>
                年齢：<input type="text" className="small-input" />
              </label>
            </div>
          </div>

          {/* 名前入力 */}
          <div className="name-input-area">
            <input type="text" className="name-input" defaultValue="たになカッター" />
          </div>

          {/* 保存ボタン */}
          <div className="submit-area">
            <button type="button" className="save-button" onClick={onClose}>保存</button>
          </div>

        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 70px;
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
          gap: 16px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .modal-title-wrapper {
          position: relative;
          border: 1px solid #cccccc;
          border-radius: 6px;
          padding: 8px 0;
          text-align: center;
          margin: 0 auto;
          width: 80%;
        }

        .modal-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }

        .modal-title-wrapper::before, .modal-title-wrapper::after,
        .modal-title-dots-right::before, .modal-title-dots-right::after {
          content: "";
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: #5fc2ea;
          border-radius: 50%;
        }
        .modal-title-wrapper::before { left: 6px; top: 6px; }
        .modal-title-wrapper::after { left: 6px; bottom: 6px; }
        .modal-title-dots-right::before { right: 6px; top: 6px; }
        .modal-title-dots-right::after { right: 6px; bottom: 6px; }

        .profile-edit-top {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .edit-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #d9d9d9;
        }

        .edit-inputs {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 14px;
          color: #333;
        }

        .small-input {
          width: 45px;
          height: 22px;
          border: 1px solid #727272;
          border-radius: 6px;
          outline: none;
        }

        .name-input-area {
          display: flex;
          justify-content: center;
        }

        .name-input {
          width: 80%;
          border: none;
          border-bottom: 1px solid #727272;
          text-align: center;
          font-size: 16px;
          padding: 4px;
          outline: none;
          color: #111;
        }

        .submit-area {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }

        .save-button {
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