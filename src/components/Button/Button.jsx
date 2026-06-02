import cls from "./Button.module.css";

export function Button({ children, type, onClick }) {
  switch (type) {
    case "red":
      return (
        <button className={`${cls.btn} ${cls.btnRed}`} onClick={onClick}>
          {children}
        </button>
      );
    case "blue":
      return (
        <button className={`${cls.btn} ${cls.btnblue}`} onClick={onClick}>
          {children}
        </button>
      );
    case "green":
      return (
        <button className={`${cls.btn} ${cls.btnGreen}`} onClick={onClick}>
          {children}
        </button>
      );
    case "carrot":
      return (
        <button className={`${cls.btn} ${cls.btnCarrot}`} onClick={onClick}>
          {children}
        </button>
      );
  }
}
