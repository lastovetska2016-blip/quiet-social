import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import EditProfile from "./EditProfile";
import {
  Home as HomeIcon,
  User,
  Users,
  Search,
  Heart,
  MessageCircle,
} from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [friendStatus, setFriendStatus] = useState(null);

  const targetUserId = userId || currentUser?.uid;
  const isOwnProfile = targetUserId === currentUser?.uid;

  useEffect(() => {
    if (!targetUserId) return;
    const fetchProfile = async () => {
      const userRef = doc(db, "users", targetUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setProfile(userSnap.data());
      } else {
        setProfile({
          displayName: "Користувач",
          email: "",
          photoURL: "",
          birthday: "",
          interests: "",
          workplace: "",
          status: "",
        });
      }
    };
    fetchProfile();

    const q = query(
      collection(db, "posts"),
      where("userId", "==", targetUserId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;
    const fetchFriends = async () => {
      const q = query(
        collection(db, "friends"),
        where("userId", "==", targetUserId),
        where("status", "==", "accepted")
      );
      const snapshot = await getDocs(q);
      const friendIds = snapshot.docs.map((doc) => doc.data().friendId);
      const friendProfiles = [];
      for (const id of friendIds) {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) friendProfiles.push({ id, ...userSnap.data() });
      }
      setFriends(friendProfiles);
    };
    fetchFriends();
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;
    const fetchGroups = async () => {
      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", targetUserId)
      );
      const snapshot = await getDocs(q);
      setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchGroups();
  }, [targetUserId]);

  useEffect(() => {
    if (!isOwnProfile || !targetUserId) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", targetUserId),
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return unsubscribe;
  }, [isOwnProfile, targetUserId]);

  useEffect(() => {
    if (!currentUser || isOwnProfile || !targetUserId) return;
    const checkFriendship = async () => {
      const q = query(
        collection(db, "friends"),
        where("userId", "==", currentUser.uid),
        where("friendId", "==", targetUserId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setFriendStatus(snapshot.docs[0].data().status);
      } else {
        setFriendStatus(null);
      }
    };
    checkFriendship();
  }, [currentUser, targetUserId, isOwnProfile]);

  const sendFriendRequest = async () => {
    if (!currentUser) return;
    await addDoc(collection(db, "friends"), {
      userId: currentUser.uid,
      friendId: targetUserId,
      status: "pending",
      createdAt: new Date(),
    });
    setFriendStatus("pending");
    await addDoc(collection(db, "notifications"), {
      userId: targetUserId,
      type: "friend_request",
      fromUserId: currentUser.uid,
      fromUserName: currentUser.displayName,
      read: false,
      createdAt: new Date(),
    });
  };

  const acceptFriendRequest = async (fromUserId, notificationId) => {
    const q = query(
      collection(db, "friends"),
      where("userId", "==", fromUserId),
      where("friendId", "==", currentUser.uid)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { status: "accepted" });
    }
    if (notificationId) {
      await deleteDoc(doc(db, "notifications", notificationId));
    }
    setFriendStatus("accepted");
    const fetchFriends = async () => {
      const q2 = query(
        collection(db, "friends"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "accepted")
      );
      const snapshot2 = await getDocs(q2);
      const friendIds = snapshot2.docs.map((doc) => doc.data().friendId);
      const friendProfiles = [];
      for (const id of friendIds) {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) friendProfiles.push({ id, ...userSnap.data() });
      }
      setFriends(friendProfiles);
    };
    fetchFriends();
  };

  const removeFriend = async () => {
    const q1 = query(
      collection(db, "friends"),
      where("userId", "==", currentUser.uid),
      where("friendId", "==", targetUserId)
    );
    const q2 = query(
      collection(db, "friends"),
      where("userId", "==", targetUserId),
      where("friendId", "==", currentUser.uid)
    );
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    snap1.forEach((doc) => doc.ref.delete());
    snap2.forEach((doc) => doc.ref.delete());
    setFriendStatus(null);
  };

  const handleUpdateProfile = (updatedData) => {
    setProfile((prev) => ({ ...prev, ...updatedData }));
  };

  if (!profile) return <div style={{ padding: 20 }}>Завантаження...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      {/* Верхнє меню */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 20,
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 10,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#555",
          }}
        >
          <HomeIcon size={18} /> Стрічка
        </Link>
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#4CAF50",
            fontWeight: 500,
          }}
        >
          <User size={18} /> Профіль
        </Link>
        <Link
          to="/groups"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#555",
          }}
        >
          <Users size={18} /> Групи
        </Link>
        <Link
          to="/search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#555",
          }}
        >
          <Search size={18} /> Пошук
        </Link>
      </div>

      {/* Обкладинка */}
      <div
        style={{
          height: 200,
          background: "linear-gradient(135deg, #a8edea, #fed6e3)",
          borderRadius: 24,
          marginBottom: 20,
        }}
      ></div>

      {/* Аватар та основна інформація */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          marginTop: -60,
          marginBottom: 20,
        }}
      >
        <img
          src={profile.photoURL || "https://via.placeholder.com/120"}
          alt="avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "4px solid white",
            background: "white",
            objectFit: "cover",
          }}
        />
        <div style={{ marginLeft: 20, flex: 1 }}>
          <h2>{profile.displayName}</h2>
          {profile.status && (
            <p style={{ color: "#555", margin: "4px 0" }}>
              ✨ {profile.status}
            </p>
          )}
          {profile.birthday && (
            <p style={{ margin: "4px 0" }}>🎂 {profile.birthday}</p>
          )}
          {profile.workplace && (
            <p style={{ margin: "4px 0" }}>💼 {profile.workplace}</p>
          )}
          {profile.interests && (
            <p style={{ margin: "4px 0" }}>⭐ Інтереси: {profile.interests}</p>
          )}
        </div>
        {isOwnProfile ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "8px 16px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 40,
            }}
          >
            Редагувати
          </button>
        ) : (
          <div>
            {friendStatus === "accepted" && (
              <button
                onClick={removeFriend}
                style={{
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 40,
                }}
              >
                Видалити з друзів
              </button>
            )}
            {friendStatus === "pending" && (
              <button
                disabled
                style={{
                  background: "#ccc",
                  padding: "8px 16px",
                  borderRadius: 40,
                }}
              >
                Запит надіслано
              </button>
            )}
            {friendStatus === null && (
              <button
                onClick={sendFriendRequest}
                style={{
                  background: "#2196F3",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 40,
                }}
              >
                Додати в друзі
              </button>
            )}
          </div>
        )}
      </div>

      {/* Вкладки */}
      <div
        style={{
          display: "flex",
          gap: 20,
          borderBottom: "1px solid #ddd",
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "posts" ? "2px solid #4CAF50" : "none",
            cursor: "pointer",
          }}
        >
          Публікації ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "friends" ? "2px solid #4CAF50" : "none",
            cursor: "pointer",
          }}
        >
          Друзі ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "groups" ? "2px solid #4CAF50" : "none",
            cursor: "pointer",
          }}
        >
          Групи ({groups.length})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("notifications")}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "notifications" ? "2px solid #4CAF50" : "none",
              cursor: "pointer",
            }}
          >
            Сповіщення {notifications.length > 0 && `(${notifications.length})`}
          </button>
        )}
      </div>

      {/* Вміст вкладок */}
      {activeTab === "posts" && (
        <div>
          {posts.length === 0 && <p>Немає постів</p>}
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 15,
                marginBottom: 15,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <p>{post.text}</p>
              {post.mediaUrl && post.mediaType === "image" && (
                <img
                  src={post.mediaUrl}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    borderRadius: 16,
                    marginTop: 10,
                    backgroundColor: "#f0f0f0",
                  }}
                />
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <video
                  src={post.mediaUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    borderRadius: 16,
                    marginTop: 10,
                  }}
                />
              )}
              {post.mediaUrl && post.mediaType === "audio" && (
                <audio
                  src={post.mediaUrl}
                  controls
                  style={{ width: "100%", marginTop: 10 }}
                />
              )}
              <div style={{ display: "flex", gap: 15, marginTop: 10 }}>
                <span>❤️ {post.likes?.length || 0}</span>
                <span>💬 {post.commentsCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "friends" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 15,
          }}
        >
          {friends.map((friend) => (
            <Link
              key={friend.id}
              to={`/profile/${friend.id}`}
              style={{
                textDecoration: "none",
                color: "black",
                textAlign: "center",
              }}
            >
              <img
                src={friend.photoURL}
                alt=""
                width={80}
                height={80}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <div>{friend.displayName}</div>
            </Link>
          ))}
          {friends.length === 0 && <p>Немає друзів</p>}
        </div>
      )}

      {activeTab === "groups" && (
        <div>
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/group/${group.id}`}
              style={{
                display: "block",
                background: "#f0f0f0",
                padding: 10,
                marginBottom: 10,
                borderRadius: 12,
                textDecoration: "none",
                color: "black",
              }}
            >
              <strong>{group.name}</strong> – {group.description}
            </Link>
          ))}
          {groups.length === 0 && <p>Не складається в жодній групі</p>}
        </div>
      )}

      {activeTab === "notifications" && isOwnProfile && (
        <div>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: 10,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {notif.type === "friend_request" && (
                  <span>
                    📩 Новий запит у друзі від{" "}
                    {notif.fromUserName || "користувача"}
                  </span>
                )}
              </div>
              {notif.type === "friend_request" && (
                <button
                  onClick={() =>
                    acceptFriendRequest(notif.fromUserId, notif.id)
                  }
                  style={{
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: 20,
                  }}
                >
                  Прийняти
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && <p>Немає сповіщень</p>}
        </div>
      )}

      {isEditing && (
        <EditProfile
          profile={profile}
          onClose={() => setIsEditing(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
}
