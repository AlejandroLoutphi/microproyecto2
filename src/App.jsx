import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
// NOTE: use firestore lite?
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import {
  signInWithPopup,
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { MainPage } from "./MainPage";
import { Register } from "./Register";
import { EditProfile } from "./EditProfile";
import { Login } from "./Login";
import { AboutUs } from "./AboutUs";
import { BlogGuide } from "./BlogGuide";
import "./App.css";

// Setup de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCBfqXp33H3Zj_8GfzjHnxW4RIMC4F5ACc",
  authDomain: "vive-avila.firebaseapp.com",
  projectId: "vive-avila",
  storageBucket: "vive-avila.firebasestorage.app",
  messagingSenderId: "889941160937",
  appId: "1:889941160937:web:172ddacef465a492689178"
};

const firebaseApp = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseGoogleProvider = new GoogleAuthProvider();

export const firebaseUsersCollection = collection(firebaseDb, "users");
export const firebaseContactMessagesCollection = collection(firebaseDb, "contactMessages");
export const firebaseBlogArticlesCollection = collection(firebaseDb, "blogArticles");

const pageList = Object.freeze({
  "": () => MainPage,
  register: () => Register,
  editProfile: () => EditProfile,
  login: () => Login,
  aboutUs: () => AboutUs,
  blogGuide: () => BlogGuide,
});
const pageString = window.location.pathname.split("/", 2)[1];
const pageStartingValue =
  pageList[pageString] ??
  (window.history.replaceState(null, "", ""), () => MainPage);

export const UserType = Object.freeze({
  student: undefined,
  admin: "admin",
  guide: "guide",
});

export const UserProvider = Object.freeze({
  viveAvila: undefined,
  google: "google",
});

const storedUser = window.localStorage.getItem("vive-avila-user");
let isFirstRender = true;

export function Navbar({ setPage, user }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <img
        loading="lazy"
        src="/nav-logo.png"
        className="nav-logo"
        alt="Navigation logo"
      />
      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        <a
          className="nav-item"
          onClick={() => void setPage(() => MainPage)}>
          Inicio
        </a>
        <a onClick={() => setPage(() => BlogGuide)} className="nav-item">
          Guía
        </a>
        <a onClick={() => setPage(() => AboutUs)} className="nav-item">
          Sobre Nosotros
        </a>
        {user ? (
          <div className="nav-dropdown-container">
            <a className="nav-item">
              Perfil
              {user.pfp && !user.provider && <div className="nav-pfp-wrapper"><img className="nav-pfp" src={user.pfp} /></div>}
            </a>
            <div className="nav-dropdown">
              {!user.provider && (
                <a onClick={() => setPage(() => EditProfile)} className="nav-item">
                  Editar Perfil
                </a>
              )}
              <a
                onClick={() => {
                  signOut(firebaseAuth);
                  setPage(() => Login);
                }}
                className="nav-item"
              >
                Cerrar Sesión
              </a>
            </div>
          </div>
        ) : (
          <a onClick={() => setPage(() => Login)} className="nav-item">
            Iniciar Sesión
          </a>
        )}
      </div>
      <div className="burger" onClick={() => setIsOpen(!isOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="footer_content">
        <div className="footer_title_container">
          <div className="footer_line"></div>
          <h2 className="footer_title">Vive Ávila</h2>
          <div className="footer_line"></div>
        </div>
        <div className="footer_info">
          Más información
          <br />
          (+58)424_8014532
        </div>
      </div>
    </footer>
  );
}

export function App() {
  const [Page, setPage] = useState(pageStartingValue);
  const [user, setUser] = useState(storedUser && JSON.parse(storedUser));
  const [notification, setNotification] = useState();

  function setAndStoreUser(u) {
    if (!u) window.localStorage.removeItem("vive-avila-user");
    else
      window.localStorage.setItem(
        "vive-avila-user",
        JSON.stringify({
          ...u,
          auth: undefined,
        })
      );
    setUser(u);
  }

  const notificationDisplayMs = 5000;
  function addNotification(n) {
    setNotification(n);
    setTimeout(() => setNotification(), notificationDisplayMs);
  }

  if (isFirstRender)
    onAuthStateChanged(firebaseAuth, async (userAuth) => {
      if (!userAuth) return void setAndStoreUser();
      if (userAuth.uid === user?.uid)
        return void setAndStoreUser({ ...user, auth: userAuth });
      if (!userAuth.emailVerified) {
        signOut(firebaseAuth);
        try {
          await sendEmailVerification(userAuth);
          addNotification(
            "Email de verificación enviado. Puede iniciar sesión después de hacer click en el link dentro de este."
          );
        } catch (e) {
          switch (e.code) {
            case "auth/too-many-requests":
              addNotification("Error al comunicarse con el servidor");
              return;
          }
        }
        return;
      }
      if (!userAuth.email.endsWith("@correo.unimet.edu.ve") && !userAuth.email.endsWith("@unimet.edu.ve"))
        return void addNotification("Error: Solo se permiten correos de la UNIMET");
      const q = query(
        firebaseUsersCollection,
        where("email", "==", userAuth.email),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];
      if (!userDoc) return;
      const dbUser = userDoc.data();
      setPage(() => MainPage);
      setAndStoreUser({ ...dbUser, auth: userAuth, docRef: userDoc.ref });
    });
  isFirstRender = false;

  async function googleSignIn(e) {
    e.preventDefault();
    try {
      const result = await signInWithPopup(firebaseAuth, firebaseGoogleProvider);
      const userAuth = result.user;
      if (!userAuth.email.endsWith("@correo.unimet.edu.ve") && !userAuth.email.endsWith("@unimet.edu.ve"))
        return void addNotification("Error: Solo se permiten correos de la UNIMET");
      const q = query(
        firebaseUsersCollection,
        where("email", "==", userAuth.email),
        limit(1)
      );
      const querySnapshot = await getCountFromServer(q);
      if (querySnapshot.data().count > 0) return void setPage(() => MainPage);
      let dbUser = {
        uid: userAuth.uid,
        username: userAuth.displayName,
        email: userAuth.email,
        phone: userAuth.phoneNumber,
        pfp: userAuth.photoURL,
        provider: UserProvider.google,
      };
      addDoc(firebaseUsersCollection, dbUser);
      setPage(() => MainPage);
    } catch (e) {
      switch (e.code) {
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
        case "auth/user-cancelled":
          return;
        default:
          console.log(e);
      }
    }
  }

  return (
    <>
      <Page
        setPage={setPage}
        user={user}
        setAndStoreUser={setAndStoreUser}
        addNotification={addNotification}
        googleSignIn={googleSignIn}
      />
      {notification && <div className="notification">{notification}</div>}
    </>
  );

}
