import { Outlet } from "react-router-dom";
import { Header } from "../Header/Header";
import cls from "./MainLayout.module.css";
export function MainLayout() {
  const currentdate = new Date().getFullYear();
  return (
    <div className={cls.wrapper}>
      <Header />
      <Outlet />
      <footer className={cls.footer}>(c) {currentdate}</footer>
    </div>
  );
}
