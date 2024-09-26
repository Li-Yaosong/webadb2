// cspell: ignore bugreport
// cspell: ignore bugreportz

import {
    MessageBar,
    MessageBarType,
    PrimaryButton,
    Stack,
    StackItem,
} from "@fluentui/react";
import { BugReport } from "@yume-chan/android-bin";
import {
    action,
    autorun,
    makeAutoObservable,
    observable,
    runInAction,
} from "mobx";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import Head from "next/head";
import { GLOBAL_STATE } from "../state";
import { RouteStackProps, saveFile } from "../utils";

class BugReportState {
    bugReport: BugReport | undefined = undefined;

    bugReportZInProgress = false;

    bugReportZProgress: string | undefined = undefined;

    bugReportZTotalSize: string | undefined = undefined;

    constructor() {
        makeAutoObservable(this, {
            generateBugReport: action.bound,
            generateBugReportZStream: action.bound,
            generateBugReportZ: action.bound,
        });

        autorun(() => {
            if (GLOBAL_STATE.adb) {
                (async () => {
                    const bugreport = await BugReport.queryCapabilities(
                        GLOBAL_STATE.adb!,
                    );
                    runInAction(() => {
                        this.bugReport = bugreport;
                    });
                })();
            } else {
                runInAction(() => {
                    this.bugReport = undefined;
                });
            }
        });
    }

    async generateBugReport() {
        await this.bugReport!.bugReport().pipeTo(saveFile("bugreport.txt"));
    }

    async generateBugReportZStream() {
        await this.bugReport!.bugReportZStream().pipeTo(
            saveFile("bugreport.zip"),
        );
    }

    async generateBugReportZ() {
        runInAction(() => {
            this.bugReportZInProgress = true;
        });

        const filename = await this.bugReport!.bugReportZ({
            onProgress: this.bugReport!.supportsBugReportZProgress
                ? action((progress, total) => {
                      this.bugReportZProgress = progress;
                      this.bugReportZTotalSize = total;
                  })
                : undefined,
        });

        const sync = await GLOBAL_STATE.adb!.sync();
        await sync.read(filename).pipeTo(saveFile("bugreport.zip"));

        sync.dispose();

        runInAction(() => {
            this.bugReportZInProgress = false;
            this.bugReportZProgress = undefined;
            this.bugReportZTotalSize = undefined;
        });
    }
}

const state = new BugReportState();

const BugReportPage: NextPage = () => {
    return (
        <Stack {...RouteStackProps}>
            <Head>
                <title>错误报告</title>
            </Head>

            <MessageBar
                messageBarType={MessageBarType.info}
                delayedRender={false}
            >
            </MessageBar>

            <StackItem>
                <PrimaryButton
                    disabled={!state.bugReport}
                    text="生成 Bug 报告"
                    onClick={state.generateBugReport}
                />
            </StackItem>

            <StackItem>
                <PrimaryButton
                    disabled={!state.bugReport?.supportsBugReportZStream}
                    text="生成压缩版错误报告（流式传输）"
                    onClick={state.generateBugReportZStream}
                />
            </StackItem>

            <StackItem>
                <Stack
                    horizontal
                    verticalAlign="center"
                    tokens={{ childrenGap: 8 }}
                >
                    <StackItem>
                        <PrimaryButton
                            disabled={
                                !state.bugReport?.supportsBugReportZ ||
                                state.bugReportZInProgress
                            }
                            text="生成压缩版错误报告"
                            onClick={state.generateBugReportZ}
                        />
                    </StackItem>

                    {state.bugReportZInProgress && (
                        <StackItem>
                            {state.bugReportZTotalSize ? (
                                <span>
                                    Progress: {state.bugReportZProgress} /{" "}
                                    {state.bugReportZTotalSize}
                                </span>
                            ) : (
                                <span>
                                    正在生成...请等待
                                    {!state.bugReport!
                                        .supportsBugReportZProgress &&
                                        "（该设备不支持进度）"}
                                </span>
                            )}
                        </StackItem>
                    )}
                </Stack>
            </StackItem>
        </Stack>
    );
};

export default observer(BugReportPage);
