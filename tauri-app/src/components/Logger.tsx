/*
    Pretty Der6y - A third-party running data upload client.
    Copyright (C) 2024  Fay Ash

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import {
  faBug,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Accessor, JSX, Signal } from "solid-js";
import {
  createContext,
  createSignal,
  For,
  mergeProps,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import Icon from "./Icon";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface Log {
  id: number;
  level: LogLevel;
  message: string;
}

const LoggerContext = createContext<{
  logs: Accessor<Log[]>;
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}>();

export function useLogger() {
  return useContext(LoggerContext);
}

const Log = (props: {
  log: Log;
  timeout?: number;
  duration?: number;
  onRemove: () => void;
}) => {
  const levelColors = {
    DEBUG: "bg-blue-500",
    INFO: "bg-green-500",
    WARN: "bg-yellow-500",
    ERROR: "bg-red-500",
  };
  const levelIcons = {
    DEBUG: faBug,
    INFO: faCircleInfo,
    WARN: faTriangleExclamation,
    ERROR: faCircleExclamation,
  };

  const merged = mergeProps({ timeout: 3000, duration: 300 }, props);
  const { level, message } = merged.log;

  const [isVisible, setIsvisible] = createSignal(true);
  let timer: NodeJS.Timeout;
  onMount(() => {
    timer = setTimeout(() => {
      setIsvisible(false);
      setTimeout(merged.onRemove, merged.duration);
    }, merged.timeout - merged.duration);
  });
  onCleanup(() => clearTimeout(timer));

  return (
    <li
      class="flex transition-opacity mt-4 justify-between items-center rounded-lg text-sm text-white px-4 py-2 shadow-lg"
      classList={{
        [levelColors[level]]: true,
        "opacity-100": isVisible(),
        "opacity-0": !isVisible(),
      }}
      style={{
        "transition-duration": `${merged.duration}ms`,
      }}
    >
      <Icon classes="mr-2" icon={levelIcons[level]} />
      <span class="max-w-sm break-words select-text">{message}</span>
      <button
        type="button"
        class="bg-transparent ml-2 focus:outline-none"
        onClick={merged.onRemove}
      >
        <Icon icon={faXmark} />
      </button>
    </li>
  );
};

const Logs = (props: { logs: Signal<Log[]> }) => {
  const [logs, setLogs] = props.logs;

  return (
    // For some reason, the z-index of leaflet is 400
    <ul class="fixed z-[500] top-0 left-1/2 transform -translate-x-1/2">
      <For each={logs()}>
        {(log) => (
          <Log log={log} onRemove={() => setLogs((prev) => prev.slice(1))} />
        )}
      </For>
    </ul>
  );
};

export const LoggerProvider = (props: {
  timeout?: number;
  children: JSX.Element;
}) => {
  const merged = mergeProps({ timeout: 3000 }, props);

  const [logs, setLogs] = createSignal([] as Log[]);
  let id = 0;

  function log(level: LogLevel, message: string) {
    const current = { level, message, id: id };
    id += 1;
    setLogs((prev) => [...prev, current]);
  }

  const logger = {
    logs,
    debug(message: string) {
      log("DEBUG", message);
    },
    info(message: string) {
      log("INFO", message);
    },
    warn(message: string) {
      log("WARN", message);
    },
    error(message: string) {
      log("ERROR", message);
    },
  };

  return (
    <LoggerContext.Provider value={logger}>
      <Logs logs={[logs, setLogs]} />
      {merged.children}
    </LoggerContext.Provider>
  );
};

export default LoggerProvider;
