"use client";

type NotificationItemProps = {
  message: string;
  type?: "default" | "count";
};

export default function NotificationItem({ message, type = "default" }: NotificationItemProps) {
  return (
    <div className="notification-item">
      {/* typeが"count"以外の時だけ、グレーの丸アイコンを表示する */}
      {type !== "count" && <div className="user-icon"></div>}
      
      <p className="message">{message}</p>

      <style jsx>{`
        .notification-item {
          display: flex;
          align-items: center;
          width: 100%;
          
          /* 上下の余白と左右の余白 */
          padding: 14px 24px;
          box-sizing: border-box;
          
          /* 下に薄いグレーの線を引く */
          border-bottom: 1px solid #dddddd;
          background-color: #ffffff;
          gap: 16px;
        }

        .user-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #d9d9d9;
          flex-shrink: 0;
        }

        .message {
          margin: 0;
          font-size: 15px;
          color: #111111;
        }
      `}</style>
    </div>
  );
}