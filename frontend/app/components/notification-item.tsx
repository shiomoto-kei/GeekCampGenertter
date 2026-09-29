type NotificationItemProps = {
  message: string;
  type?: "like" | "count";
};

export default function NotificationItem({
  message,
  type = "like",
}: NotificationItemProps) {
  return (
    <div
      className={`notification-item ${
        type === "count" ? "count-notification" : ""
      }`}
    >
      {type === "like" && <div className="user-icon"></div>}

      <span className="notification-message">
        {message}
      </span>

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

        .user-icon {
          width: 25px;
          height: 25px;

          flex-shrink: 0;

          margin-right: 10px;

          background-color: #d9d9d9;

          border-radius: 50%;
        }

        .notification-message {
          font-size: 13px;
          color: #222222;
        }

        /* いいね○○件を超えました */
        .count-notification {
          padding-left: 25px;

          min-height: 40px;
        }
      `}</style>
    </div>
  );
}
