import {
    IComponentAsProps,
    INavButtonProps,
    IconButton,
    Nav,
    PrimaryButton,
    Stack,
    StackItem,
} from "@fluentui/react";
import { makeStyles, mergeClasses, shorthands } from "@griffel/react";
import type { AppProps } from "next/app";
import getConfig from "next/config";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Connect, ErrorDialogProvider, ExternalLink } from "../components";
import "../styles/globals.css";
import { Icons } from "../utils";
import { register as registerIcons } from "../utils/icons";
registerIcons();

const ROUTES = [
    // {
    //     url: "/",
    //     icon: Icons.Bookmark,
    //     name: "README",
    // },
    {
        url: "/device-info",
        icon: Icons.Phone,
        name: "设备信息",
    },
    {
        url: "/file-manager",
        icon: Icons.Folder,
        name: "文件管理",
    },
    {
        url: "/framebuffer",
        icon: Icons.Camera,
        name: "屏幕截图",
    },
    {
        url: "/shell",
        icon: Icons.WindowConsole,
        name: "交互式shell",
    },
    {
        url: "/scrcpy",
        icon: Icons.PhoneLaptop,
        name: "远程控制",
    },
    // {
    //     url: "/tcpip",
    //     icon: Icons.WifiSettings,
    //     name: "ADB over WiFi",
    // },
    {
        url: "/install",
        icon: Icons.Box,
        name: "安装 APK",
    },
    {
        url: "/logcat",
        icon: Icons.BookSearch,
        name: "日志查看",
    },
    {
        url: "/power",
        icon: Icons.Power,
        name: "电源菜单",
    },
    // {
    //     url: "/chrome-devtools",
    //     icon: Icons.WindowDevTools,
    //     name: "Chrome 远程调试",
    // },
    {
        url: "/bug-report",
        icon: Icons.Bug,
        name: "错误报告",
    },
    {
        url: "/packet-log",
        icon: Icons.TextGrammarError,
        name: "数据包日志",
    },
];

function NavLink({
    link,
    defaultRender: DefaultRender,
    ...props
}: IComponentAsProps<INavButtonProps>) {
    if (!link) {
        return null;
    }

    return (
        <Link href={link.url} legacyBehavior passHref>
            <DefaultRender {...props} />
        </Link>
    );
}

const useClasses = makeStyles({
    titleContainer: {
        ...shorthands.borderBottom("1px", "solid", "rgb(243, 242, 241)"),
    },
    hidden: {
        display: "none",
    },
    title: {
        ...shorthands.padding("4px", "0"),
        fontSize: "20px",
        textAlign: "center",
    },
    leftColumn: {
        width: "270px",
        paddingRight: "8px",
        ...shorthands.borderRight("1px", "solid", "rgb(243, 242, 241)"),
        overflowY: "auto",
    },
});

const {
    publicRuntimeConfig: { basePath },
} = getConfig();

function App({ Component, pageProps }: AppProps) {
    const classes = useClasses();
    
    const [leftPanelVisible, setLeftPanelVisible] = useState(false);
    const toggleLeftPanel = useCallback(() => {
        setLeftPanelVisible((value) => !value);
    }, []);
    useEffect(() => {
        setLeftPanelVisible(innerWidth > 650);
    }, []);

    const router = useRouter();
    // const { address, port } = router.query; // 获取URL中的参数，如 ?param1=value1&param2=value2
    if ("noLayout" in Component) {
        return <Component {...pageProps} />;
    }

    const address = router.query.address as string
    const port = router.query.port as string
    
    return (
        <ErrorDialogProvider>
            <Head>
                <link rel="manifest" href={basePath + "/manifest.json"} />
            </Head>

            <Stack verticalFill>
                <Stack
                    className={classes.titleContainer}
                    horizontal
                    verticalAlign="center"
                >
                    <IconButton
                        checked={leftPanelVisible}
                        title="Toggle Menu"
                        iconProps={{ iconName: Icons.Navigation }}
                        onClick={toggleLeftPanel}
                    />

                    <StackItem grow>
                        {/* <div className={classes.title}>Tango</div> */}
                    </StackItem>
                </Stack>

                <Stack
                    grow
                    horizontal
                    verticalFill
                    disableShrink
                    styles={{
                        root: {
                            minHeight: 0,
                            overflow: "hidden",
                            lineHeight: "1.5",
                        },
                    }}
                >
                    <StackItem
                        className={mergeClasses(
                            classes.leftColumn,
                            !leftPanelVisible && classes.hidden,
                        )}
                    >
                        <Connect 
                            address={address}
                            port={port}
                        />

                        <Nav
                            groups={[
                                {
                                    links: ROUTES.map((route) => ({
                                        ...route,
                                        key: route.url + "/?address=" + {address} + "&port=" + {port},
                                    })),
                                },
                            ]}
                            linkAs={NavLink}
                            selectedKey={router.pathname}
                        />
                    </StackItem>

                    <StackItem grow styles={{ root: { width: 0 } }}>
                        <Component {...pageProps} />
                    </StackItem>
                </Stack>
            </Stack>
        </ErrorDialogProvider>
    );
}

export default App;
