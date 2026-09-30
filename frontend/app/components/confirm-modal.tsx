"use client";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
};

export default function ConfirmModal({ 
  isOpen, onClose, title, message, confirmText, onConfirm 
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">{title}</h2>
          <p className="modal-message">{message}</p>
          
          <div className="button-group">
            <button className="cancel-button" onClick={onClose}>キャンセル</button>
            <button className="confirm-button" onClick={onConfirm}>{confirmText}</button>
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
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .modal-title {
          font-size: 18px;
          color: #555555;
          margin: 0;
          font-weight: normal;
        }

        .modal-message {
          font-size: 15px;
          color: #111111;
          margin: 0;
          text-align: center;
        }

        .button-group {
          display: flex;
          gap: 16px;
          margin-top: 10px;
        }

        .cancel-button {
          background-color: #ffffff;
          border: 1px solid #727272;
          border-radius: 6px;
          padding: 6px 16px;
          font-size: 13px;
          color: #333333;
          cursor: pointer;
        }

        .confirm-button {
          background-color: #ff8d82;
          border: none;
          border-radius: 6px;
          padding: 6px 16px;
          font-size: 13px;
          color: #ffffff;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}