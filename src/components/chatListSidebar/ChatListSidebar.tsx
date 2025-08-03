'use client';
import socket from '@/api/socket';
import { useLoading } from '@/components/common';
import { useDebounce } from '@/hooks/hookCustoms';
import { useSkeletonLoading } from '@/hooks/useSkeletonLoading';
import { AppDispatch, RootState } from '@/lib/store';
import {
  addConversation,
  deleteConversationForUser,
  fetchConversations,
  markConversationAsRead,
  searchConversation,
  setSelectedConversation,
  updateConversationById,
  updateUnreadCount,
} from '@/lib/store/reducer/conversationSlice/conversationSlice';
import {
  searchUserByEmail,
  setSelectedUser as setUserSelected,
} from '@/lib/store/reducer/user/userSlice';
import { UserType, Conversation } from '@/types';
import { DeleteOutlined } from '@ant-design/icons';
import { Input, List, Modal, Skeleton, message } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ChatListSidebar.module.scss';
import formatUpdatedAt from './format';

const ChatListSidebar = React.memo(function ChatListSidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const conversations = useSelector((state: RootState) => state.conversationReducer.conversations);
  const [searchText, setSearchText] = useState('');
  const searchResults = useSelector((state: RootState) => state.conversationReducer.searchResults);

  // Sử dụng useLoading hook
  const { loading: isSearching, withLoading: withSearch } = useLoading();
  const conversationLoading = useSelector((state: RootState) => state.conversationReducer.loading);
  const conversationError = useSelector((state: RootState) => state.conversationReducer.error);

  // Sử dụng skeleton loading hook
  const { showSkeleton, handleRetry, hasError, errorMessage } = useSkeletonLoading({
    loading: conversationLoading,
    error: conversationError,
    retryFn: () => dispatch(fetchConversations()),
  });
  const selectedConversation = useSelector(
    (state: RootState) => state.conversationReducer.selectedConversation
  );
  const currentUser = useSelector((state: RootState) => state.userReducer.user);
  const userStatuses = useSelector((state: RootState) => state.userStatusReducer.statuses);

  const [searchUserResult, setSearchUserResult] = useState<UserType | null>(null);

  const isEmail = useCallback((str: string) => /\S+@\S+\.\S+/.test(str), []);

  const isEmailSearch = useMemo(() => {
    return searchText && isEmail(searchText);
  }, [searchText, isEmail]);

  const handleSearch = withSearch(async (value: string) => {
    if (!value.trim()) {
      setSearchUserResult(null);
      return;
    }

    if (isEmail(value)) {
      const result = await dispatch(searchUserByEmail(value));
      const user =
        typeof result.payload === 'object' && result.payload && '_id' in result.payload
          ? result.payload
          : null;
      setSearchUserResult(user);
    } else {
      setSearchUserResult(null);
      await dispatch(searchConversation(value));
    }
  });

  // Debounce search với hook
  const debouncedSearch = useDebounce(handleSearch, 300);

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchText(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleSelectUser = useCallback(
    (user: UserType) => {
      const existing = conversations.find((c) => c.receiver?._id === user._id);
      if (existing) {
        dispatch(setSelectedConversation(existing));
        // Không clear selectedUser để giữ thông tin user
        // dispatch(setUserSelected(null));
      } else {
        // Set selectedUser để có thể tạo conversation mới khi gửi tin nhắn
        dispatch(setUserSelected(user));
        dispatch(setSelectedConversation(null));
      }
    },
    [dispatch, conversations]
  );

  const handleSelect = useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c._id === id);
      if (conversation) {
        dispatch(setSelectedConversation(conversation));
        // Reset unreadCount khi chọn conversation
        if (!conversation.deactivatedAt) {
          dispatch(markConversationAsRead(id)).then(() => {
            dispatch(
              updateUnreadCount({
                conversationId: id,
                userId: currentUser?._id || '',
                count: 0,
                increment: false,
              })
            );
          });
        }
        if (conversation.isGroup) {
          dispatch(setUserSelected(null));
        } else if (conversation.receiver) {
          const receiver: UserType = {
            _id: conversation.receiver._id || '',
            username: conversation.receiver.username || '',
            avatar: conversation.receiver.avatar || '',
            nickname: conversation.receiver.nickname || '',
            email: conversation.receiver.email || '',
            gender: conversation.receiver.gender || '',
            online:
              typeof (conversation.receiver as UserType).online === 'boolean'
                ? (conversation.receiver as UserType).online
                : false,
          };
          dispatch(setUserSelected(receiver));
        }
      }
    },
    [dispatch, conversations, currentUser]
  );

  const handleDeleteConversation = (conversationId: string) => {
    Modal.confirm({
      title: 'Xác nhận xoá hội thoại',
      content:
        'Bạn có chắc chắn muốn xoá đoạn hội thoại này? Đoạn chat sẽ bị ẩn khỏi danh sách của bạn.',
      okText: 'Xoá',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await dispatch(
            deleteConversationForUser({
              conversationId,
              deleteMessages: false, // Chỉ ẩn, không xóa thật
            })
          );
          message.success('Đã xoá hội thoại!');
        } catch {
          message.error('Xoá hội thoại thất bại!');
        }
      },
    });
  };

  const listData = useMemo(() => {
    if (searchText) {
      if (isEmailSearch) {
        // Hiển thị kết quả search user từ searchUserResult
        return searchUserResult ? [searchUserResult] : [];
      }
      return searchResults;
    }
    const userId = currentUser?._id || '';
    const filteredConversations = conversations.filter((c) => {
      // Nếu user chưa xóa conversation, hiện
      if (!c.deletedAt || !c.deletedAt[userId]) {
        return true;
      }

      // Nếu là 1-1, chỉ ẩn nếu cả 2 user đều đã xóa
      if (!c.isGroup && c.members) {
        const allDeleted = c.members.every((m) => {
          const memberId = typeof m === 'string' ? m : String(m);
          return c.deletedAt && c.deletedAt[memberId];
        });
        if (allDeleted) {
          return false;
        }
      }

      // Nếu user đã xóa conversation, kiểm tra xem có tin nhắn mới không
      const deletedAt = c.deletedAt[userId];
      if (deletedAt && c.updatedAt) {
        const deletedTime = new Date(deletedAt);
        const updatedTime = new Date(c.updatedAt);
        if (updatedTime > deletedTime) {
          return true; // Hiện conversation có tin nhắn mới
        }
      }

      // Nếu user đã xóa và không có tin nhắn mới -> ẩn
      return false;
    });
    const sortedConversations = filteredConversations.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
    return sortedConversations;
  }, [searchText, isEmailSearch, searchUserResult, searchResults, currentUser?._id, conversations]);

  React.useEffect(() => {
    // Lắng nghe tin nhắn mới để update conversation
    const handleReceiveMessage = (msg: {
      conversationId: string;
      content: string;
      type?: string;
      fromUserId: string;
      createdAt: string;
    }) => {
      if (msg.conversationId && msg.content) {
        const oldConv = conversations.find((c) => c._id === msg.conversationId);
        if (!oldConv) return;

        // Cập nhật conversation với thông tin mới
        dispatch(
          updateConversationById({
            ...oldConv,
            lastMessage: msg.content,
            lastMessageType: msg.type,
            lastMessageSenderId: msg.fromUserId,
            updatedAt: msg.createdAt,
          })
        );

        // Refresh conversation list nếu conversation đã bị xóa
        if (oldConv.deletedAt && oldConv.deletedAt[currentUser?._id || '']) {
          dispatch(fetchConversations());
        }
      }
    };
    // Lắng nghe cập nhật unreadCount
    const handleUnreadCountUpdated = (data: {
      conversationId: string;
      count: number;
      userId: string;
    }) => {
      if (data.conversationId && typeof data.count === 'number') {
        const oldConv = conversations.find((c) => c._id === data.conversationId);
        if (!oldConv) return;
        dispatch(
          updateConversationById({
            ...oldConv,
            unreadCount: {
              ...(oldConv.unreadCount &&
              typeof oldConv.unreadCount === 'object' &&
              !Array.isArray(oldConv.unreadCount)
                ? oldConv.unreadCount
                : {}),
              [data.userId]: data.count,
            },
          })
        );
      }
    };
    // Lắng nghe conversation mới
    const handleNewConversation = (data: { conversation: Conversation }) => {
      if (data.conversation && data.conversation._id) {
        dispatch(addConversation(data.conversation));
      }
    };
    socket.on('receive_message', handleReceiveMessage);
    socket.on('unread_count_updated', handleUnreadCountUpdated);
    socket.on('new_conversation_created', handleNewConversation);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('unread_count_updated', handleUnreadCountUpdated);
      socket.off('new_conversation_created', handleNewConversation);
    };
  }, [dispatch, conversations]);

  return (
    <div className={styles.chatListSidebar}>
      <div className={styles.header}>
        <Input.Search
          placeholder="Tìm kiếm"
          value={searchText}
          onChange={(e) => handleSearchInput(e.target.value)}
          style={{ marginBottom: 16 }}
        />
      </div>

      <div className={styles.chatList}>
        {/* Skeleton loading cho conversations */}
        {showSkeleton && (
          <div>
            {[...Array(6)].map((_, idx) => (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }} key={idx}>
                <Skeleton.Avatar active size="large" shape="circle" style={{ marginRight: 12 }} />
                <Skeleton
                  active
                  title={false}
                  paragraph={{ rows: 2, width: ['60%', '40%'] }}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#ff4d4f', marginBottom: '10px' }}>{errorMessage}</p>
            <button
              onClick={handleRetry}
              style={{
                padding: '8px 16px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Normal content */}
        {!showSkeleton && !hasError && (
          <>
            <List
              dataSource={listData}
              renderItem={(item: Conversation | UserType) => {
                // Type guard to check if item is UserType (search result)
                const isUserType = (obj: Conversation | UserType): obj is UserType => {
                  return 'username' in obj && 'email' in obj && !('isGroup' in obj);
                };

                // Kiểm tra nếu là user search result
                if (isUserType(item)) {
                  return (
                    <List.Item
                      onClick={() => handleSelectUser(item)}
                      className={styles.userSearchResult}
                    >
                      <div className={styles.avatarContainer}>
                        <img
                          src={item.avatar || '/avtDefault.png'}
                          alt="avatar"
                          className={styles.avatar}
                        />
                        {/* Hiển thị trạng thái online cho search results */}
                        <div
                          className={`online-status small ${userStatuses[item._id]?.isOnline ? 'online' : 'offline'}`}
                        />
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.name}>{item.nickname || item.username}</div>
                        <div className={styles.email}>{item.email || item.username}</div>
                      </div>
                    </List.Item>
                  );
                }

                // At this point, item is definitely Conversation
                const conversation = item as Conversation;

                // Xử lý hiển thị cho cả 1-1 và nhóm chat
                let displayName = '';
                let displayAvatar = '';

                if (conversation.isGroup) {
                  // Nhóm chat
                  displayName = conversation.name || '';
                  displayAvatar = conversation.avatar || '/avtDefault.png';
                } else {
                  // 1-1 chat
                  const receiver = conversation.memberPreviews?.find(
                    (user: UserType) => user._id !== currentUser?._id
                  );
                  displayName = receiver ? receiver.nickname || receiver.username : '';
                  displayAvatar = receiver ? receiver.avatar : '/avtDefault.png';
                }

                return (
                  <List.Item
                    className={`${styles.chatItem} ${selectedConversation?._id === conversation._id ? styles.active : ''}`}
                    onClick={() => handleSelect(conversation._id)}
                  >
                    <div
                      className={styles.avatarContainer}
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <img
                        src={displayAvatar || '/avtDefault.png'}
                        alt="avatar"
                        className={styles.avatar}
                        style={{ display: 'block' }}
                      />
                      {/* Hiển thị trạng thái online cho 1-1 chat */}
                      {!conversation.isGroup &&
                        (() => {
                          const receiver = conversation.memberPreviews?.find(
                            (user: UserType) => user._id !== currentUser?._id
                          );
                          const receiverId = receiver?._id;
                          const isOnline = receiverId ? userStatuses[receiverId]?.isOnline : false;
                          return (
                            <span
                              className={`online-status small ${isOnline ? 'online' : 'offline'}`}
                              style={{ position: 'absolute', bottom: 2, right: 2, zIndex: 2 }}
                            />
                          );
                        })()}
                      {/* Hiển thị dấu xanh cho nhóm khi có thành viên online */}
                      {conversation.isGroup &&
                        (() => {
                          const onlineCount =
                            conversation.members?.filter(
                              (memberId: string) =>
                                memberId !== currentUser?._id && userStatuses[memberId]?.isOnline
                            ).length || 0;
                          return onlineCount > 0 ? (
                            <span
                              className="online-status small online"
                              style={{ position: 'absolute', bottom: 2, right: 2, zIndex: 2 }}
                            />
                          ) : null;
                        })()}
                    </div>
                    <div className={styles.chatInfo}>
                      <div className={styles.name}>{displayName}</div>
                      <div className={styles.message}>
                        {(() => {
                          // Kiểm tra nếu có lastMessageType hoặc lastMessage
                          if (!conversation.lastMessageType && !conversation.lastMessage) return '';

                          const isCurrentUserMessage =
                            conversation.lastMessageSenderId === currentUser?._id;
                          const prefix = isCurrentUserMessage ? 'Bạn: ' : '';

                          if (conversation.lastMessageType === 'image') {
                            return `${prefix}Đã gửi 1 ảnh`;
                          } else if (conversation.lastMessageType === 'video') {
                            return `${prefix}Đã gửi 1 video`;
                          } else if (conversation.lastMessageType === 'file') {
                            return `${prefix}Đã gửi 1 file`;
                          } else {
                            return `${prefix}${conversation.lastMessage}`;
                          }
                        })()}
                      </div>
                    </div>
                    <div className={styles.rightContent}>
                      <div className={styles.time}>
                        {conversation.updatedAt ? formatUpdatedAt(conversation.updatedAt) : ''}
                      </div>
                      {/* Hiển thị số tin nhắn chưa đọc */}
                      {(() => {
                        const userId = currentUser?._id || '';
                        // Handle cả trường hợp unreadCount là number (cũ) và object/map (mới)
                        let unreadCount = 0;
                        if (typeof conversation.unreadCount === 'number') {
                          // Trường hợp cũ: unreadCount là number
                          unreadCount = conversation.unreadCount;
                        } else if (
                          conversation.unreadCount &&
                          typeof conversation.unreadCount === 'object'
                        ) {
                          // Trường hợp mới: unreadCount là object/map
                          const unreadCountObj = conversation.unreadCount as { get?: (key: string) => number } & Record<string, number>;
                          unreadCount =
                            typeof unreadCountObj.get === 'function'
                              ? unreadCountObj.get(userId) || 0
                              : unreadCountObj[userId] || 0;
                        }
                        const shouldShowBadge = unreadCount > 0;
                        return shouldShowBadge ? (
                          <div className={styles.unreadBadge}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        ) : null;
                      })()}
                      <DeleteOutlined
                        className={styles.deleteIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation._id);
                        }}
                      />
                    </div>
                  </List.Item>
                );
              }}
            />
          </>
        )}
      </div>
    </div>
  );
});
export default ChatListSidebar;
