import {
    Icon,
    MessageBar,
    Separator,
    Stack,
    TooltipHost,
} from "@fluentui/react";
import { AdbFeature } from "@yume-chan/adb";
import { observer } from "mobx-react-lite";
import type { NextPage } from "next";
import Head from "next/head";
import { GLOBAL_STATE } from "../state";
import { Icons, RouteStackProps } from "../utils";

const KNOWN_FEATURES: Record<string, string> = {
    [AdbFeature.ShellV2]: `“shell”命令现在支持分离子进程的标准输出和标准错误，并返回退出代码`,
    // 'cmd': '',
    [AdbFeature.StatV2]:
        '"sync”命令现在支持“STA2”（比旧的“STAT”返回更多的文件信息）和“LST2”（返回目录的信息）子命令',
    [AdbFeature.ListV2]:
        '“sync”命令现在支持“LST2”子命令，该子命令在列出目录时比旧的“LIST”返回更多信息',
    // 'apex': '',
    // 'abb': '',
    // 'fixed_push_symlink_timestamp': '',
    [AdbFeature.AbbExec]:
        'Supports "abb_exec" variant that can be used to install App faster',
    // 'remount_shell': '',
    // 'track_app': '',
    // 'sendrecv_v2': '',
    sendrecv_v2_brotli:
        'Supports "brotli" compression algorithm when pushing/pulling files',
    sendrecv_v2_lz4:
        'Supports "lz4" compression algorithm when pushing/pulling files',
    sendrecv_v2_zstd:
        'Supports "zstd" compression algorithm when pushing/pulling files',
    // 'sendrecv_v2_dry_run_send': '',
};

const DeviceInfo: NextPage = () => {
    return (
        <Stack {...RouteStackProps}>
            <Head>
                <title>设备信息</title>
            </Head>

            <MessageBar delayedRender={false}>
                <code>ro.product.name</code>
            </MessageBar>
            <span>产品名称: {GLOBAL_STATE.adb?.banner.product}</span>
            <Separator />

            <MessageBar delayedRender={false}>
                <code>ro.product.model</code>
            </MessageBar>
            <span>型号名称: {GLOBAL_STATE.adb?.banner.model}</span>
            <Separator />

            <MessageBar delayedRender={false}>
                <code>ro.product.device</code>
            </MessageBar>
            <span>设备名称: {GLOBAL_STATE.adb?.banner.device}</span>
            <Separator />
            <span>
                <span>Features: </span>
                {GLOBAL_STATE.adb?.banner.features.map((feature, index) => (
                    <span key={feature}>
                        {index !== 0 && <span>, </span>}
                        <span>{feature}</span>
                        {KNOWN_FEATURES[feature] && (
                            <TooltipHost
                                content={<span>{KNOWN_FEATURES[feature]}</span>}
                            >
                                <Icon
                                    style={{ marginLeft: 4 }}
                                    iconName={Icons.Info}
                                />
                            </TooltipHost>
                        )}
                    </span>
                ))}
            </span>
        </Stack>
    );
};

export default observer(DeviceInfo);
