import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Container.module.scss";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return <div className={cn(styles.container, className)}>{children}</div>;
}
