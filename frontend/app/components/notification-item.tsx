type NotificationItemProps = {
  message: string;
  iconUrl?: string | null;
  isRead?: boolean;
  date?: string;
};

export default function NotificationItem({
  message,
  iconUrl = null,
  isRead = true,
  date,
}: NotificationItemProps) {
  return (
    <div className={`notification-item ${isRead ? "" : "unread"}`}>
      <div className="user-icon" aria-hidden="true">{iconUrl && <img src={iconUrl} alt="" />}</div>
      <div className="notification-copy"><span className="notification-message">{message}</span>{date && <time className="notification-date">{date}</time>}</div>

      <style jsx>{`
        .notification-item {
          width: 100%;
          min-height: 40px;

          display: flex;
          align-items: center;

          padding: 0 20px;

          box-sizing: border-box;

          border-bottom: 1px solid #d6d6d6;

          background-color: #ffffff;
        }
        .unread { background-color: #eff9f1; }
        .notification-copy { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
        .notification-date { font-size: 11px; color: #666; }

        .user-icon {
          width: 25px;
          height: 25px;

          flex-shrink: 0;

          margin-right: 10px;

          background-color: #d9d9d9;

          border-radius: 50%;
          overflow: hidden;
        }

        .user-icon img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .notification-message {
          font-size: 13px;
          color: #222222;
        }

      `}</style>
    </div>
  );
}
