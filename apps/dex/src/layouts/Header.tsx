import { Disclosure, Menu } from "@headlessui/react";
import { ChevronDownIcon, XIcon } from "@heroicons/react/outline";
import {
  AppearTransition,
  BalanceIcon,
  ChangelogIcon,
  DotsVerticalIcon,
  formatNumberAsCurrency,
  LockIcon,
  Logo,
  LogoFull,
  PlusIcon,
  PoolsIcon,
  RowanIcon,
  SurfaceB,
  SwapIcon,
  useWindowSize,
} from "@sifchain/ui";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";

import WalletConnector from "~/compounds/WalletConnector";
import { useRowanPriceQuery, useTVLQuery } from "~/domains/clp/hooks";
import { useFlag } from "~/lib/flags";

export function useMenuItems() {
  const isMarginEnabled = useFlag("margin");
  return [
    {
      title: "Swap",
      href: "/swap",
      icon: <SwapIcon />,
    },
    {
      title: "Balance",
      href: "/balances",
      icon: <BalanceIcon />,
    },
    {
      title: "Pools",
      href: "/pools",
      icon: <PoolsIcon />,
    },
    {
      title: "Margin",
      href: "/margin",
      icon: <PlusIcon />,
      hidden: !isMarginEnabled,
    },
    {
      title: "Changelog",
      href: "/changelog",
      icon: <ChangelogIcon />,
    },
  ].filter((x) => !x.hidden);
}

const Header = () => {
  const windowSize = useWindowSize();

  return (
    <header className="bg-black md:p-4 grid">
      {windowSize.width && (
        <Disclosure
          as="div"
          className="block md:flex md:items-center md:gap-8 justify-between"
          defaultOpen={windowSize.width >= 768}
        >
          {({ open }) => (
            <>
              <section className="flex justify-between items-center md:grid md:place-items-center shadow-inset-border md:shadow-none">
                <Link href="/">
                  <a className="md:p-0">
                    <LogoFull className="hidden md:inline-block h-24 md:h-12" />
                    <Logo className="h-8 md:hidden" />
                  </a>
                </Link>
                <div className="md:hidden">
                  <Disclosure.Button className="p-4">
                    {open ? (
                      <XIcon className="h-6 w-6" />
                    ) : (
                      <ChevronDownIcon className="h-6 w-6" />
                    )}
                  </Disclosure.Button>
                </div>
              </section>
              <AppearTransition show={open}>
                <Disclosure.Panel
                  className="absolute z-10 bg-black top-14 left-0 right-0 md:top-0 md:flex md:w-full md:relative"
                  static={windowSize.width >= 768}
                >
                  <div className="grid md:flex p-4 md:p-0 gap-4 xl:gap-6 4xl:gap-8 md:w-full">
                    <Nav />
                    <RowanStats />
                    <WalletConnector />
                  </div>
                </Disclosure.Panel>
              </AppearTransition>
            </>
          )}
        </Disclosure>
      )}
    </header>
  );
};

const Nav = ({ visibleItems = 4 }) => {
  const router = useRouter();
  const currentPath = router.asPath;

  const menuItems = useMenuItems();

  return (
    <nav className="w-full md:flex md:flex-1 md:justify-center">
      <ul className="grid gap-2 md:flex items-center md:gap-4 xl:gap-5 4xl:gap-8">
        {menuItems.slice(0, visibleItems).map(({ title, href }) => (
          <li key={title}>
            <Link href={href}>
              <a
                role="navigation"
                className={clsx(
                  "flex items-center gap-4 p-2 hover:bg-gray-800 hover:opacity-80 rounded-md transition-all",
                  {
                    "bg-gray-600": currentPath === href,
                  },
                )}
              >
                <span className="text-gray-200 font-semibold text-sm">
                  {title}
                </span>
              </a>
            </Link>
          </li>
        ))}
        <li className="flex items-center relative">
          <Menu>
            {({ open }) => (
              <>
                <Menu.Button
                  className={clsx("rotate-90", {
                    "ring-1 ring-gray-50 ring-offset-gray-800 rounded-full ring-offset-4":
                      open,
                  })}
                >
                  <DotsVerticalIcon className="h-4 w-4" />
                </Menu.Button>
                <Menu.Items
                  as={SurfaceB}
                  className="absolute top-7 right-0 z-10 p-2 grid gap-2"
                >
                  {menuItems.slice(visibleItems).map(({ title, href }) => (
                    <Menu.Item key={title}>
                      <Link href={href}>
                        <a
                          role="navigation"
                          className={clsx(
                            "flex items-center gap-4 p-2 hover:bg-gray-800 hover:opacity-80 rounded-md transition-all",
                            {
                              "bg-gray-600": currentPath === href,
                            },
                          )}
                        >
                          <span className="text-gray-200 font-semibold text-sm">
                            {title}
                          </span>
                        </a>
                      </Link>
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </>
            )}
          </Menu>
        </li>
      </ul>
    </nav>
  );
};

const RowanStats = () => {
  const { data: TVL, isLoading: isLoadingTVL } = useTVLQuery();
  const { data: rowanPrice, isLoading: isLoadingRowanPrice } =
    useRowanPriceQuery();

  const rowanStats = [
    {
      id: "price",
      icon: <RowanIcon />,
      label: (
        <>
          {isLoadingRowanPrice || isNaN(rowanPrice)
            ? "..."
            : formatNumberAsCurrency(rowanPrice)}
          <span className="ml-3">/</span>
        </>
      ),
    },
    {
      id: "tvl",
      icon: <LockIcon />,
      label: (
        <>
          {isLoadingTVL || isNaN(TVL) ? "..." : formatNumberAsCurrency(TVL)} TVL
        </>
      ),
    },
  ];

  return (
    <section className="md:items-center gap-2 bg-gray-800 rounded flex justify-center m-auto flex-nowrap max-w-min md:max-w-auto px-1.5 py-1">
      {rowanStats.map(({ id, icon, label }) => (
        <div
          key={id}
          className="flex items-center gap-1 text-gray-300 whitespace-nowrap"
        >
          <span className="h-6 w-6 grid place-items-center">{icon}</span>
          <span className="font-semibold text-xs">{label}</span>
        </div>
      ))}
    </section>
  );
};

export default Header;
