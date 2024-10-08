import {
    Dialog,
    LayerHost,
    Link,
    PrimaryButton,
    ProgressIndicator,
    Stack,
    StackItem,
} from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { makeStyles, shorthands } from "@griffel/react";
import { WebCodecsDecoder } from "@yume-chan/scrcpy-decoder-webcodecs";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import Head from "next/head";
import { KeyboardEvent, useEffect, useState } from "react";
import { DemoModePanel, DeviceView, ExternalLink } from "../components";
import {
    NavigationBar,
    SETTING_DEFINITIONS,
    SETTING_STATE,
    STATE,
    ScrcpyCommandBar,
    SettingItem,
    VideoContainer,
} from "../components/scrcpy";
import { useLocalStorage } from "../hooks";
import { GLOBAL_STATE } from "../state";
import { CommonStackTokens, RouteStackProps, formatSpeed } from "../utils";
import { useRouter } from 'next/router';
const useClasses = makeStyles({
    layerHost: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: "none",
        ...shorthands.margin(0),
    },
    fullScreenContainer: {
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "black",
        ":focus-visible": {
            ...shorthands.outline("0"),
        },
    },
    fullScreenStatusBar: {
        display: "flex",
        color: "white",
        columnGap: "12px",
        ...shorthands.padding("8px", "20px"),
    },
    spacer: {
        flexGrow: 1,
    },
});

const ConnectingDialog = observer(() => {
    const classes = useClasses();
    const layerHostId = useId("layerHost");

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <>
            <LayerHost id={layerHostId} className={classes.layerHost} />

            <Dialog
                hidden={!STATE.connecting}
                modalProps={{ layerProps: { hostId: layerHostId } }}
                dialogContentProps={{ title: "连接中..." }}
            >
                <Stack tokens={CommonStackTokens}>
                    <ProgressIndicator
                        label="下载远程服务器中..."
                        percentComplete={
                            STATE.serverTotalSize
                                ? STATE.serverDownloadedSize /
                                  STATE.serverTotalSize
                                : undefined
                        }
                        description={formatSpeed(
                            STATE.debouncedServerDownloadedSize,
                            STATE.serverTotalSize,
                            STATE.serverDownloadSpeed
                        )}
                    />

                    <ProgressIndicator
                        label="将远程服务器推送至设备中..."
                        progressHidden={
                            STATE.serverTotalSize === 0 ||
                            STATE.serverDownloadedSize !== STATE.serverTotalSize
                        }
                        percentComplete={
                            STATE.serverUploadedSize / STATE.serverTotalSize
                        }
                        description={formatSpeed(
                            STATE.debouncedServerUploadedSize,
                            STATE.serverTotalSize,
                            STATE.serverUploadSpeed
                        )}
                    />

                    <ProgressIndicator
                        label="在设备上启动远程服务器中..."
                        progressHidden={
                            STATE.serverTotalSize === 0 ||
                            STATE.serverUploadedSize !== STATE.serverTotalSize
                        }
                    />
                </Stack>
            </Dialog>
        </>
    );
});

async function handleKeyEvent(e: KeyboardEvent<HTMLDivElement>) {
    if (!STATE.client) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { type, code } = e;
    STATE.keyboard![type === "keydown" ? "down" : "up"](code);
}

function handleBlur() {
    if (!STATE.client) {
        return;
    }

    STATE.keyboard?.reset();
}

const FullscreenHint = observer(function FullscreenHint({
    keyboardLockEnabled,
}: {
    keyboardLockEnabled: boolean;
}) {
    const classes = useClasses();

    const [hintHidden, setHintHidden] = useLocalStorage<`${boolean}`>(
        "scrcpy-hint-hidden",
        "false"
    );

    if (!keyboardLockEnabled || !STATE.isFullScreen || hintHidden === "true") {
        return null;
    }

    return (
        <div className={classes.fullScreenStatusBar}>
            <div>{GLOBAL_STATE.device?.serial}</div>
            <div>FPS: {STATE.fps}</div>

            <div className={classes.spacer} />

            <div>Press and hold ESC to exit full screen</div>

            <Link onClick={() => setHintHidden("true")}>
                {`不再显示`}
            </Link>
        </div>
    );
});
import AdbDaemonWebSocketDevice from "@yume-chan/adb-daemon-ws";
const Scrcpy: NextPage = () => {
    const classes = useClasses();
    const router = useRouter();
    const { param1, param2 } = router.query; // 获取URL中的参数，如 ?param1=value1&param2=value2

    useEffect(() => {
        // 检查是否存在查询参数，并根据这些参数执行操作
        if (param1) {
            console.log('Received param1:', param1);
            // 可以在这里根据 param1 做一些状态更新或者请求等操作
        }

        if (param2) {
            console.log('Received param2:', param2);
            // 处理 param2 的逻辑
        }
    }, [param1, param2]); // 当 param1 或 param2 改变时重新执行
    // const [webSocketDeviceList, setWebSocketDeviceList] = useState<AdbDaemonWebSocketDevice[]>([]);
    // // const [selectedDevice, setSelectedDevice] = useState<AdbDaemonWebSocketDevice | undefined>(undefined);
    // const [connecting, setConnecting] = useState(false);
    // useEffect(() => {
    // addWebSocketDeviceExternally(false,"ws://" + param1 + ":" + param2, setWebSocketDeviceList);
    // // connectToDeviceExternally(webSocketDeviceList.at(0), setConnecting);
    // }, [param1, param2, webSocketDeviceList]);
    useEffect(() => {
        // Detect WebCodecs support at client side
        if (
            SETTING_STATE.decoders.length === 1 &&
            WebCodecsDecoder.isSupported()
        ) {
            runInAction(() => {
                SETTING_STATE.decoders.unshift({
                    key: "webcodecs",
                    name: "WebCodecs",
                    Constructor: WebCodecsDecoder,
                });
            });
        }
    }, []);

    const [keyboardLockEnabled, setKeyboardLockEnabled] = useState(false);
    useEffect(() => {
        if (!("keyboard" in navigator)) {
            return;
        }

        // Keyboard Lock is only effective in fullscreen mode,
        // but the `lock` method can be called at any time.

        // @ts-expect-error
        navigator.keyboard.lock();
        setKeyboardLockEnabled(true);

        return () => {
            // @ts-expect-error
            navigator.keyboard.unlock();
        };
    }, []);

    useEffect(() => {
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    return (
        <Stack {...RouteStackProps}>
            <Head>
                <title>Scrcpy - {param1}</title>
            </Head>

            {STATE.running ? (
                <>
                    <ScrcpyCommandBar />

                    <Stack horizontal grow styles={{ root: { height: 0 } }}>
                        <div
                            ref={STATE.setFullScreenContainer}
                            className={classes.fullScreenContainer}
                            tabIndex={0}
                            onKeyDown={handleKeyEvent}
                            onKeyUp={handleKeyEvent}
                        >
                            <FullscreenHint
                                keyboardLockEnabled={keyboardLockEnabled}
                            />

                            <DeviceView
                                width={STATE.rotatedWidth}
                                height={STATE.rotatedHeight}
                                BottomElement={NavigationBar}
                            >
                                <VideoContainer />
                            </DeviceView>
                        </div>

                        <div
                            style={{
                                padding: 12,
                                overflow: "hidden auto",
                                display: STATE.logVisible ? "block" : "none",
                                width: 500,
                                fontFamily: "monospace",
                                overflowY: "auto",
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                            }}
                        >
                            {STATE.log.map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </div>

                        <DemoModePanel
                            style={{
                                display: STATE.demoModeVisible
                                    ? "block"
                                    : "none",
                            }}
                        />
                    </Stack>
                </>
            ) : (
                <>
                    <StackItem align="start">
                        <PrimaryButton
                            text="开始"
                            disabled={!GLOBAL_STATE.adb}
                            onClick={STATE.start}
                        />
                    </StackItem>

                    {SETTING_DEFINITIONS.get().map((definition) => (
                        <SettingItem
                            key={definition.key}
                            definition={definition}
                            value={
                                (SETTING_STATE[definition.group] as any)[
                                    definition.key
                                ]
                            }
                            onChange={action(
                                (definition, value) =>
                                    ((SETTING_STATE[definition.group] as any)[
                                        definition.key
                                    ] = value)
                            )}
                        />
                    ))}

                    <ConnectingDialog />
                </>
            )}
        </Stack>
    );
};

export default observer(Scrcpy);
