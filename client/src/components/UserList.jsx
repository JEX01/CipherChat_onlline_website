import React from 'react';

export default function UserList({ users, currentUsername }) {
  return (
    <div className="user-list-sidebar">
      <div className="sidebar-header">
        <h3>Online Users</h3>
        <span className="user-count-badge">{users.length}</span>
      </div>
      <div className="users-container">
        {users.length === 0 ? (
          <p className="no-users-text">No active users</p>
        ) : (
          <ul className="users-list">
            {users.map((user) => {
              const isMe = user.username === currentUsername;
              return (
                <li key={user.id} className="user-item">
                  <span className="online-indicator"></span>
                  <span className="user-name">
                    {user.username} {isMe && <span className="me-badge">(You)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
