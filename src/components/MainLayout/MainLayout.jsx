import { Outlet } from "react-router-dom";

import cls from "./MainLayout.module.css";
export function MainLayout() {
  const currentdate = new Date().getFullYear();
  return (
    <div className={cls.wrapper}>
      <Outlet />
      <footer className={cls.footer}>(c) {currentdate}</footer>
    </div>
  );
}
