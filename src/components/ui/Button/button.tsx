import Link from "next/link";
import type { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./button.module.scss";

export const BUTTON_COLORS = {
  def: "",
  black20: "button_black20",
} as const;

export const BUTTON_VARIANTS = {
  def: '',
  small: 'button_small',
}

type ButtonColor = (typeof BUTTON_COLORS)[keyof typeof BUTTON_COLORS];
type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];

type TButton = {
  children: ReactNode;
  className?: string;
  url?: string;
  color?: ButtonColor;
  variant?: ButtonVariant;
};

export const Button: FC<TButton> = ({
  className,
  children,
  url,
  color = BUTTON_COLORS.def,
  variant = BUTTON_VARIANTS.small
}) => {
  const buttonClassName = cn(styles.button, className, styles[color], styles[variant]);

  if (url) {
    return (
      <Link className={buttonClassName} href={url}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClassName} type="button">
      {children}
    </button>
  );
};
