import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import cls from "./Homepage.module.css";

const STORAGE_KEY = "shift_data";

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export function Homepage() {
  const saved = loadFromStorage();

  const [startTime, setStartTime] = useState(saved?.startTime ?? null);
  const [totalCases, setTotalCases] = useState(saved?.totalCases ?? 0);
  const [totalBreakMs, setTotalBreakMs] = useState(saved?.totalBreakMs ?? 0);
  const [pauseTime, setPauseTime] = useState(saved?.pauseTime ?? null);
  const [totalCasesPerHour, setTotalCasesPerHour] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [orderInput, setOrderInput] = useState("");

  const intervalRef = useRef(null);
  const startTimeRef = useRef(startTime);
  const totalCasesRef = useRef(totalCases);
  const totalBreakMsRef = useRef(totalBreakMs);
  const pauseTimeRef = useRef(pauseTime);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  useEffect(() => {
    totalCasesRef.current = totalCases;
  }, [totalCases]);
  useEffect(() => {
    totalBreakMsRef.current = totalBreakMs;
  }, [totalBreakMs]);
  useEffect(() => {
    pauseTimeRef.current = pauseTime;
  }, [pauseTime]);

  useEffect(() => {
    if (!startTime) return;
    saveToStorage({ startTime, totalCases, totalBreakMs, pauseTime });
  }, [startTime, totalCases, totalBreakMs, pauseTime]);

  useEffect(() => {
    if (!startTime) return;

    intervalRef.current = setInterval(() => {
      const start = startTimeRef.current;
      if (!start) return;

      // Пауза — замораживаем пикрейт
      if (pauseTimeRef.current) return;

      const workingTimeMs = Date.now() - start - totalBreakMsRef.current;
      if (workingTimeMs < 1000) return;

      const workingTimeHours = workingTimeMs / (1000 * 60 * 60);
      setTotalCasesPerHour(
        Math.round(totalCasesRef.current / workingTimeHours),
      );
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  const startShiftHandler = () => {
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
  };

  const openPopup = () => {
    setOrderInput("");
    setShowPopup(true);
  };

  const confirmOrder = () => {
    const count = parseInt(orderInput, 10);
    if (!isNaN(count) && count > 0) {
      setTotalCases((prev) => prev + count);
    }
    setShowPopup(false);
  };

  const pauseHandler = () => {
    if (pauseTime) {
      const breakDuration = Date.now() - pauseTime;
      setTotalBreakMs((prev) => prev + breakDuration);
      totalBreakMsRef.current += breakDuration;
      setPauseTime(null);
    } else {
      setPauseTime(Date.now());
    }
  };

  const finishShiftHandler = () => {
    clearStorage();
    setStartTime(null);
    setTotalCases(0);
    setTotalCasesPerHour(0);
    setPauseTime(null);
    setTotalBreakMs(0);
    setShowPopup(false);
    totalCasesRef.current = 0;
    totalBreakMsRef.current = 0;
    startTimeRef.current = null;
    pauseTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatBreakTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}м ${seconds}с`;
  };

  return (
    <>
      <div>
        <div className={cls.pickrate}>
          {totalCasesPerHour > 0 ? totalCasesPerHour : "—"}
        </div>
        <strong className={cls.strong}>Current Pick Rate</strong>
      </div>

      <div>
        <div className={cls.addorder}>
          <Button
            type={"blue"}
            onClick={openPopup}
            disabled={!startTime || !!pauseTime}
          >
            Add order
          </Button>
        </div>

        <div className={cls.btnGroup}>
          <Button
            type={"red"}
            onClick={startShiftHandler}
            disabled={startTime !== null}
          >
            Start Shift
          </Button>
          <Button type={"carrot"} onClick={pauseHandler} disabled={!startTime}>
            {pauseTime ? "Resume" : "Pause"}
          </Button>
          <Button
            type={"green"}
            onClick={finishShiftHandler}
            disabled={!startTime}
          >
            Finish Shift
          </Button>
        </div>

        <div className={cls.info}>
          <p>
            Start time:{" "}
            {startTime && new Date(startTime).toLocaleString("ru-RU")}
          </p>
          <p>Total cases: {totalCases}</p>
          <p>Total breaks time: {formatBreakTime(totalBreakMs)}</p>
        </div>
      </div>

      {showPopup && (
        <div className={cls.overlay} onClick={() => setShowPopup(false)}>
          <div className={cls.popup} onClick={(e) => e.stopPropagation()}>
            <h3 className={cls.popupTitle}>Add cases</h3>
            <input
              className={cls.popupInput}
              type="number"
              min="1"
              placeholder="Enter number of cases"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmOrder()}
              autoFocus
            />
            <div className={cls.popupButtons}>
              <Button type={"blue"} onClick={confirmOrder}>
                Confirm
              </Button>
              <Button type={"red"} onClick={() => setShowPopup(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
