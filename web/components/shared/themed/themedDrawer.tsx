import React, { useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowsPointingOutIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/20/solid";
import { ArrowsPointingInIcon } from "@heroicons/react/24/outline";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { Fragment, useState } from "react";
import { clsx } from "../clsx";
import { useTheme } from "next-themes";

interface ThemedDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultExpanded?: boolean;
  defaultWidth?: string;
}

const ThemedDrawer: React.FC<ThemedDrawerProps> = ({
  open,
  setOpen,
  children,
  actions,
  defaultExpanded = false,
  defaultWidth = "md:min-w-[60rem] w-full md:w-[60vw]",
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(defaultExpanded);

  const { theme } = useTheme();

  useEffect(() => {
    setExpanded(false);
  }, []);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className={clsx(theme ?? "light", "relative z-[200]")}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-300 bg-opacity-50 transition-opacity dark:bg-slate-700 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200 sm:duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200 sm:duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={clsx(
                    defaultExpanded
                      ? defaultWidth
                      : expanded
                        ? "w-full md:w-[60vw] md:min-w-[60rem]"
                        : "w-full md:w-[36vw] md:min-w-[35rem]",
                    "pointer-events-auto duration-300 ease-in-out",
                  )}
                >
                  <div
                    className={clsx(
                      "relative flex h-full flex-col overflow-y-scroll bg-white shadow-2xl dark:bg-black",
                    )}
                  >
                    <div className="sticky top-0 z-50 flex flex-row justify-between bg-white px-4 py-6 dark:bg-black sm:px-6">
                      <div className="flex w-full flex-row items-center space-x-2 text-slate-500">
                        <button
                          onClick={() => setOpen(false)}
                          className="-m-1 rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          <ChevronDoubleRightIcon className="h-5 w-5" />
                        </button>
                        {!defaultExpanded && (
                          <Tooltip title={clsx(expanded ? "Shrink" : "Expand")}>
                            <button
                              onClick={() => setExpanded(!expanded)}
                              className="-m-1 rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                              {expanded ? (
                                <ArrowsPointingInIcon className="h-5 w-5" />
                              ) : (
                                <ArrowsPointingOutIcon className="h-5 w-5" />
                              )}
                            </button>
                          </Tooltip>
                        )}

                        <div className="w-full">{actions}</div>
                      </div>
                    </div>
                    <div className="relative my-2 flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ThemedDrawer;
