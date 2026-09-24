import { type PageInfo, Pages } from "@keybr/pages-shared";
import { Icon } from "@keybr/widget";
import { clsx } from "clsx";
import { type ReactNode } from "react";
import { useIntl } from "react-intl";
import { NavLink } from "react-router";
import * as styles from "./NavMenu.module.less";
import { ThemeSwitcher } from "./themes/ThemeSwitcher.tsx";

export function NavMenu(_: { readonly currentPath: string }) {
  return (
    <div className={styles.root}>
      <MenuItem>
        <ThemeSwitcher />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.practice} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.profile} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.help} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.typingTest} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.layouts} />
      </MenuItem>
    </div>
  );
}

function MenuItem({ children }: { readonly children: ReactNode }) {
  return <div className={styles.item}>{children}</div>;
}

function MenuItemLink({
  page: {
    path,
    link: { label, title, icon },
  },
}: {
  readonly page: PageInfo;
}) {
  const { formatMessage } = useIntl();
  return (
    <NavLink
      className={({ isActive }) =>
        clsx(styles.link, isActive && styles.isActive)
      }
      to={path}
      title={title && formatMessage(title)}
    >
      <Icon className={styles.icon} shape={icon ?? ""} />
      <span className={styles.label}>{formatMessage(label)}</span>
    </NavLink>
  );
}
