import { Outlet } from "react-router-dom";
import { Header } from "../Header/Header";
import cls from "./MainLayout.module.css";
export function MainLayout() {
  return (
    <div className={cls.wrapper}>
      <Header />
      <Outlet />
      <footer className={cls.footer}></footer>
    </div>
  );
}
