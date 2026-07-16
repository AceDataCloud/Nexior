#!/usr/bin/env python3
"""Apply Japanese translations to all ja locale files.

Only modifies src/i18n/ja/*.json.
Preserves all intentional technical strings (model names, brand names, API terms).
"""
from __future__ import annotations
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
JA_DIR = REPO_ROOT / "src" / "i18n" / "ja"

# Each entry: key -> {msg: new_message, desc: new_description}
# If msg/desc is None, that field is not changed.
# 'm' = message only, 'd' = description only, 'md' = both

TRANSLATIONS: dict[str, dict[str, dict[str, str | None]]] = {

    # ─── application.json ──────────────────────────────────────────────────
    "application.json": {
        "badge.shared": {
            "msg": "共有済み",
            "desc": "自分以外のユーザーから共有されたアプリケーションに表示されるバッジ",
        },
    },

    # ─── chat.json ─────────────────────────────────────────────────────────
    "chat.json": {
        # consent descriptions
        "consent.selectScopes": {
            "desc": "コンセントカードから開くスコープ選択ダイアログのタイトル。{provider} は上流プロバイダー名（例：Gmail）",
        },
        "consent.selectScopesHint": {
            "desc": "ユーザーが特定のスコープをオプトアウトできることを説明する本文。チェックボックスグループの上に表示される",
        },
        "consent.installFailed": {
            "desc": "コンセントカードから AuthBackend のインストールエンドポイントがエラーを返した際に表示されるトースト",
        },
        # scheduledTasks messages
        "scheduledTasks.navTitle": {"msg": "スケジュールタスク"},
        "scheduledTasks.title": {"msg": "スケジュールタスク"},
        "scheduledTasks.create": {"msg": "新規"},
        "scheduledTasks.edit": {"msg": "タスクを編集"},
        "scheduledTasks.empty": {
            "msg": "スケジュールタスクがありません。「新規」をクリックして作成してください。"
        },
        "scheduledTasks.noRuns": {"msg": "まだ実行履歴がありません"},
        "scheduledTasks.loadError": {"msg": "読み込みに失敗しました"},
        "scheduledTasks.deleteConfirm": {
            "msg": "「{name}」を削除しますか？タスクの実行が停止されます。"
        },
        "scheduledTasks.triggerNow": {
            "msg": "今すぐ実行",
            "desc": "スケジュールに関係なく、タスクを即時トリガーする",
        },
        "scheduledTasks.triggerSuccess": {
            "msg": "実行をトリガーしました。結果は間もなく実行履歴に表示されます。",
            "desc": "手動トリガー成功",
        },
        "scheduledTasks.triggerError": {
            "msg": "トリガーに失敗しました。後でもう一度お試しください。",
            "desc": "手動トリガーエラー",
        },
        "scheduledTasks.viewResult": {"msg": "結果を表示"},
        "scheduledTasks.viewRuns": {"msg": "実行履歴"},
        "scheduledTasks.jitterHint": {"msg": "±60秒のジッター"},
        "scheduledTasks.runCount": {"msg": "{count}回実行済み"},
        "scheduledTasks.state.enabled": {"msg": "アクティブ"},
        "scheduledTasks.state.disabled": {"msg": "一時停止"},
        "scheduledTasks.state.error": {"msg": "エラー"},
        "scheduledTasks.run.queued": {"msg": "待機中"},
        "scheduledTasks.run.running": {"msg": "実行中"},
        "scheduledTasks.run.success": {"msg": "成功"},
        "scheduledTasks.run.failed": {"msg": "失敗"},
        "scheduledTasks.run.needs_user_input": {"msg": "操作が必要"},
        "scheduledTasks.run.waiting_for_device": {"msg": "ブラウザデバイスを待機中"},
        "scheduledTasks.scheduleType.daily": {"msg": "毎日"},
        "scheduledTasks.scheduleType.hourly": {"msg": "毎時"},
        "scheduledTasks.scheduleType.weekly": {"msg": "毎週"},
        "scheduledTasks.scheduleType.cron": {"msg": "Cron式"},
        "scheduledTasks.scheduleType.interval": {
            "msg": "間隔",
            "desc": "固定間隔で実行",
        },
        "scheduledTasks.form.intervalUnit.minute": {
            "msg": "分",
            "desc": "間隔単位：分",
        },
        "scheduledTasks.form.intervalUnit.hour": {
            "msg": "時間",
            "desc": "間隔単位：時間",
        },
        "scheduledTasks.form.intervalUnit.day": {
            "msg": "日",
            "desc": "間隔単位：日",
        },
        "scheduledTasks.form.hourlyMinute": {
            "msg": "〇分",
            "desc": "毎時何分に実行するか",
        },
        "scheduledTasks.form.hourlyMinuteHint": {
            "msg": "毎時何分に実行するか（0〜59）",
            "desc": "毎時分ヒント",
        },
        "scheduledTasks.form.intervalHint": {
            "msg": "前回の実行から一定間隔ごとに1回実行（最短1分）",
            "desc": "間隔ヒント",
        },
        "scheduledTasks.form.cronHint": {
            "msg": "標準5フィールドのCron式：分 時 日 月 曜日",
            "desc": "Cronヒント",
        },
        "scheduledTasks.form.schedulePreview": {
            "msg": "{text}に実行",
            "desc": "スケジュールプレビュー",
        },
        "scheduledTasks.humanize.everyNMinutes": {
            "msg": "{n}分ごと",
            "desc": "人間が読める表示：N分ごと",
        },
        "scheduledTasks.humanize.everyNHours": {
            "msg": "{n}時間ごと",
            "desc": "人間が読める表示：N時間ごと",
        },
        "scheduledTasks.humanize.everyNDays": {
            "msg": "{n}日ごと",
            "desc": "人間が読める表示：N日ごと",
        },
        "scheduledTasks.humanize.hourlyAtMinute": {
            "msg": "毎時{n}分",
            "desc": "人間が読める表示：毎時N分",
        },
        "scheduledTasks.humanize.dailyAt": {
            "msg": "毎日{time}",
            "desc": "人間が読める表示：毎日〇時",
        },
        "scheduledTasks.humanize.weeklyAt": {
            "msg": "{weekday} {time}",
            "desc": "人間が読める表示：毎週〇曜日〇時",
        },
        "scheduledTasks.humanize.cronRaw": {
            "msg": "Cron: {cron}",
            "desc": "人間が読める表示：Cronそのまま",
        },
        "scheduledTasks.humanize.once": {
            "msg": "{time}に1回",
            "desc": "人間が読める表示：1回のみ",
        },
        "scheduledTasks.form.name": {"msg": "タスク名"},
        "scheduledTasks.form.namePlaceholder": {"msg": "例：毎日のニュースまとめ"},
        "scheduledTasks.form.model": {"msg": "モデル"},
        "scheduledTasks.form.prompt": {"msg": "プロンプト"},
        "scheduledTasks.form.promptPlaceholder": {
            "msg": "スケジュールされた質問や指示を入力してください。{'{{date}}'}、{'{{run_count}}'}、{'{{last_output}}'}変数が使えます。"
        },
        "scheduledTasks.form.promptHint": {
            "msg": "変数：{'{{date}}'}今日の日付、{'{{run_count}}'}実行回数、{'{{last_output}}'}前回の出力スニペット"
        },
        "scheduledTasks.form.schedule": {"msg": "頻度"},
        "scheduledTasks.form.time": {"msg": "時刻"},
        "scheduledTasks.form.weekday": {"msg": "曜日"},
        "scheduledTasks.form.cron": {"msg": "Cron式"},
        "scheduledTasks.form.skillNotActiveTitle": {
            "msg": "まずスキルを連携してください",
            "desc": "定期タスクで認可されたスキル/MCPがまだユーザーに連携されていない場合に表示されるダイアログタイトル",
        },
        "scheduledTasks.form.skillNotActiveMessage": {
            "msg": "スキル「{name}」はまだアカウントに連携またはアクティブになっていません。連携しない場合、バックグラウンド実行時にこのタスクが使用できない場合があります。先に連携することをお勧めします。",
            "desc": "警告本文。{name}はスキル/MCP名。連携されていないことを説明し、このまま保存するオプションを提供する",
        },
        "scheduledTasks.form.skillNotActiveForce": {
            "msg": "このまま保存",
            "desc": "連携チェックをスキップして定期タスクを保存する確認ボタン",
        },
        "scheduledTasks.form.required": {"msg": "タスク名とプロンプトを入力してください"},
        "scheduledTasks.form.maxTurns": {
            "desc": "定期タスクの1回の実行あたりのエージェントターン上限",
        },
        "scheduledTasks.form.maxTurnsHint": {
            "desc": "定期タスクの1回の実行あたりのエージェントターン上限",
        },
        # artifacts
        "artifacts.unhide": {
            "msg": "再表示",
            "desc": "非表示にした出力を元に戻す",
        },
        "artifacts.showHidden": {
            "msg": "非表示を表示",
            "desc": "フィルターバーで非表示の出力を含めるトグル",
        },
        "artifacts.hiddenBadge": {
            "msg": "非表示",
            "desc": "現在非表示になっている出力に表示されるバッジ",
        },
        # browserTool
        "browserTool.title": {
            "msg": "ブラウザ操作",
            "desc": "BrowserDeviceツール操作のフォールバックタイトル",
        },
        "browserTool.state.choose_device": {"msg": "ブラウザデバイスを選択"},
        "browserTool.state.device_offline": {"msg": "ブラウザデバイスがオフラインです"},
        "browserTool.state.awaiting_device": {"msg": "ブラウザデバイスを待機中"},
        "browserTool.state.awaiting_local_approval": {
            "msg": "ブラウザデバイスで承認待ち"
        },
        "browserTool.state.takeover_required": {
            "msg": "ブラウザデバイスで引き継ぎが必要"
        },
        "browserTool.state.executing": {"msg": "ブラウザで実行中"},
        "browserTool.state.completed": {"msg": "完了"},
        "browserTool.state.denied": {"msg": "ブラウザデバイスで拒否されました"},
        "browserTool.state.expired": {"msg": "ブラウザリクエストの期限切れ"},
        "browserTool.state.cancel_too_late": {"msg": "キャンセルが間に合いません"},
    },

    # ─── codingBridge.json ─────────────────────────────────────────────────
    "codingBridge.json": {
        "nodeList.title": {
            "msg": "デバイス",
            "desc": "Coding Bridgeデバイスリストのタイトル",
        },
        "nodeList.refresh": {
            "msg": "更新",
            "desc": "デバイスリストを更新する",
        },
        "nodeList.pair": {
            "msg": "デバイスをペアリング",
            "desc": "ペアリングダイアログを開く",
        },
        "nodeList.empty": {
            "msg": "まだペアリングされたデバイスがありません。",
            "desc": "デバイスリストが空の場合のメッセージ",
        },
        "nodeList.pairFirst": {
            "msg": "最初のデバイスをペアリング",
            "desc": "空の状態でのペアリングボタン",
        },
        "nodeList.remove": {
            "msg": "削除",
            "desc": "デバイスを削除する",
        },
        "nodeList.removeConfirm": {
            "msg": "デバイス「{name}」を削除しますか？再度ペアリングが必要になります。",
            "desc": "デバイス削除の確認",
        },
        "nodeList.removeSuccess": {
            "msg": "デバイスが削除されました。",
            "desc": "デバイス削除完了のトースト",
        },
        "nodeList.removeFailed": {
            "msg": "デバイスの削除に失敗しました。",
            "desc": "デバイス削除エラーのトースト",
        },
        "status.online": {
            "msg": "オンライン",
            "desc": "デバイスのオンライン状態",
        },
        "status.offline": {
            "msg": "オフライン",
            "desc": "デバイスのオフライン状態",
        },
        "connection.disconnected": {
            "msg": "切断済み",
            "desc": "リレー接続が切断された状態",
        },
        "connection.connecting": {
            "msg": "接続中…",
            "desc": "リレー接続中の状態",
        },
        "connection.connected": {
            "msg": "接続済み",
            "desc": "リレー接続済みの状態",
        },
        "connection.error": {
            "msg": "接続エラー",
            "desc": "リレー接続エラーの状態",
        },
        "pair.title": {
            "msg": "デバイスをペアリング",
            "desc": "ペアリングダイアログのタイトル",
        },
        "pair.intro": {
            "msg": "Coding Bridgeエージェントをコンピュータで実行し、ここにペアリングコードを入力してウェブからリモート操作してください。",
            "desc": "ペアリングダイアログの説明文",
        },
        "pair.step1": {
            "msg": "エージェントをインストール（Python 3.10以上が必要）：",
            "desc": "ペアリング手順1",
        },
        "pair.step2": {
            "msg": "起動してプロンプトに従ってください：",
            "desc": "ペアリング手順2",
        },
        "pair.step3": {
            "msg": "表示されたペアリングコードを以下に入力してください。",
            "desc": "ペアリング手順3",
        },
        "pair.codePlaceholder": {
            "msg": "ペアリングコード",
            "desc": "ペアリングコード入力プレースホルダー",
        },
        "pair.claim": {
            "msg": "デバイスをペアリング",
            "desc": "ペアリング確認ボタン",
        },
        "pair.success": {
            "msg": "デバイス「{name}」がペアリングされました。",
            "desc": "ペアリング成功のトースト",
        },
        "pair.invalidCode": {
            "msg": "ペアリングコードが無効または期限切れです。",
            "desc": "ペアリングコード無効エラー",
        },
        "pair.usedCode": {
            "msg": "このペアリングコードはすでに使用済みです。",
            "desc": "ペアリングコード使用済みエラー",
        },
        "pair.failed": {
            "msg": "デバイスのペアリングに失敗しました。",
            "desc": "ペアリング汎用エラー",
        },
        "permission.title": {
            "msg": "権限が必要です",
            "desc": "権限ダイアログのタイトル",
        },
        "permission.subtitle": {
            "msg": "エージェントがツールを使用しようとしています。続行するには承認してください。",
            "desc": "権限ダイアログのサブタイトル",
        },
        "permission.deny": {
            "msg": "拒否",
            "desc": "ツール権限を拒否する",
        },
        "permission.allow": {
            "msg": "許可",
            "desc": "ツール権限を許可する",
        },
        "session.noDevice": {
            "msg": "コーディングを開始するデバイスを選択してください。",
            "desc": "デバイス未選択時のプレースホルダー",
        },
        "session.newSession": {
            "msg": "新しいセッション",
            "desc": "新しいセッションを開始する",
        },
        "session.deviceOffline": {
            "msg": "このデバイスはオフラインです。続行するにはCoding Bridgeエージェントを起動してください。",
            "desc": "デバイスオフライン警告",
        },
        "session.nodeId": {
            "desc": "ノードIDの診断ラベル",
        },
        "session.sessionId": {
            "desc": "セッションIDの診断ラベル",
        },
        "session.traceId": {
            "desc": "トレースIDの診断ラベル",
        },
        "session.startHint": {
            "msg": "メッセージを送信してこのデバイスでセッションを開始してください。",
            "desc": "空のトランスクリプトのヒント",
        },
        "session.cwdPlaceholder": {
            "msg": "作業ディレクトリ（任意）",
            "desc": "作業ディレクトリ入力プレースホルダー",
        },
        "session.modelPlaceholder": {
            "msg": "モデル（任意）",
            "desc": "モデル入力プレースホルダー",
        },
        "session.promptPlaceholder": {
            "msg": "エージェントにメッセージを送信…",
            "desc": "プロンプト入力プレースホルダー",
        },
        "session.send": {
            "msg": "送信",
            "desc": "プロンプト送信ボタン",
        },
        "session.retry": {
            "desc": "失敗後に最後のプロンプトを再実行する",
        },
        "session.editPrompt": {
            "msg": "編集",
            "desc": "送信済みプロンプトを編集して新しいターンとして再送信する",
        },
        "session.editingBanner": {
            "msg": "編集中 — 送信するとこの時点まで会話が巻き戻されます。",
            "desc": "過去のプロンプトを編集中に表示されるバナー",
        },
        "session.editRestoreCode": {
            "msg": "コードも復元する",
            "desc": "編集時にファイルの変更もロールバックするチェックボックス",
        },
        "session.editCancel": {
            "msg": "キャンセル",
            "desc": "過去のプロンプトの編集をキャンセルする",
        },
        "session.editSubmit": {
            "msg": "更新",
            "desc": "編集済みプロンプトを送信（巻き戻して再実行）",
        },
        "session.enterHint": {
            "msg": "Enterで送信、Shift+Enterで改行。",
            "desc": "コンポーザーのキーボードヒント",
        },
        "transcript.turnFailed": {
            "msg": "ターン失敗",
            "desc": "ターン結果失敗ラベル",
        },
        "transcript.turnDone": {
            "msg": "完了",
            "desc": "ターン結果完了ラベル",
        },
        "history.button": {
            "desc": "会話履歴ドロワーを開く",
        },
        "history.title": {
            "desc": "履歴ドロワーのタイトル",
        },
        "history.intro": {
            "desc": "履歴ドロワーの説明文",
        },
        "history.refresh": {
            "desc": "履歴リストを再読み込みする",
        },
        "history.loading": {
            "desc": "履歴読み込み中のメッセージ",
        },
        "history.empty": {
            "desc": "履歴が空の場合のメッセージ",
        },
        "history.messages": {
            "desc": "履歴アイテムのメッセージ数",
        },
        "history.readonly": {
            "desc": "読み取り専用の再生通知",
        },
        "history.running": {
            "desc": "デバイス上で現在ライブ実行中の会話を示す",
        },
        "history.resumeHint": {
            "desc": "再開コンポーザーのヒント",
        },
        "history.claudeLabel": {
            "desc": "再生されたClaudeセッションのラベル",
        },
        "history.codexLabel": {
            "desc": "再生されたCodexセッションのラベル",
        },
        "session.permissionModeLabel": {
            "desc": "権限モード選択ラベル",
        },
        "session.permissionModeDefault": {
            "desc": "権限モード：ツール使用前に確認する",
        },
        "session.permissionModeAcceptEdits": {
            "desc": "権限モード：ファイル編集を自動承認",
        },
        "session.permissionModePlan": {
            "desc": "権限モード：読み取り専用の計画モード",
        },
        "session.permissionModeBypass": {
            "desc": "権限モード：すべての権限確認をバイパス",
        },
        "session.providerLabel": {
            "desc": "エージェントバックエンド選択ラベル",
        },
        "session.modelDefault": {
            "msg": "デフォルトモデル",
        },
        "session.cwdDefault": {
            "msg": "デフォルトディレクトリ",
        },
        "session.settings": {
            "msg": "セッション設定",
        },
        "session.settingsLocked": {
            "msg": "このセッションの設定はロックされています",
        },
        "session.attachFile": {
            "msg": "ファイルを添付",
        },
        "session.attachmentImageAlt": {
            "msg": "添付画像",
        },
        "session.removeAttachment": {
            "msg": "添付ファイルを削除",
        },
        "session.uploadingAttachment": {
            "msg": "添付ファイルをアップロード中…",
        },
        "session.attachmentTooLarge": {
            "msg": "ファイルが大きすぎます。各ファイルは50MB以下にしてください。",
        },
        "session.attachmentLimit": {
            "msg": "{count}個まで添付できます。",
        },
        "session.attachmentUploadError": {
            "msg": "添付ファイルのアップロードに失敗しました。",
        },
    },

    # ─── common.json ───────────────────────────────────────────────────────
    "common.json": {
        "error.loginLinkExpired": {
            "msg": "ログインリンクの有効期限が切れました。もう一度サインインしてください。"
        },
        "message.mobileNowOnAppStore": {"msg": "App Storeで公開中"},
        "button.getOnAppStore": {"msg": "App Storeで入手"},
        "message.mobileAppStoreHint": {"msg": "スキャンしてApp Storeを開く"},
        "settings.localToolsComputerUseTitle": {"msg": "コンピュータ操作（試験的）"},
        "settings.localToolsComputerUseHint": {
            "msg": "AIが画面を見て、このコンピュータのマウスとキーボードを操作できるようにします。"
        },
        "settings.localToolsMcpTitle": {"msg": "MCPサーバー"},
        "settings.localToolsMcpHint": {
            "msg": "stdioを介してローカルMCPサーバーに接続します。それらのツールがAIで利用可能になります。"
        },
        "settings.localToolsMcpAdd": {"msg": "サーバーを追加"},
        "settings.localToolsMcpArgsHint": {"msg": "1行に1引数。"},
        "settings.localToolsMcpEnvHint": {"msg": "1行にKEY=VALUE。"},
        "settings.localToolsMcpNoServers": {"msg": "MCPサーバーが設定されていません。"},
        "settings.localToolsMcpNamePlaceholder": {"msg": "例：filesystem"},
        "settings.localToolsMcpCommandPlaceholder": {"msg": "例：npx"},
        "settings.localToolsMcpNameRequired": {
            "msg": "各サーバーには名前とコマンドが必要です。"
        },
        "settings.localToolsMcpDuplicateName": {
            "msg": "サーバー名は一意である必要があります。"
        },
        "settings.localToolsMcpNameInvalid": {
            "msg": "名前には英字、数字、ハイフン、アンダースコアのみ使用できます。"
        },
        "settings.localToolsMcpReconnect": {"msg": "テスト / 再接続"},
        "settings.localToolsMcpConnecting": {"msg": "接続中…"},
        "settings.localToolsMcpNotSaved": {"msg": "まだ保存されていません"},
        "settings.localToolsMcpConnected": {"msg": "接続済み · {n}ツール"},
        "settings.localToolsMcpFailed": {"msg": "接続に失敗しました"},
        "settings.localToolsMcpPlatformHint": {
            "msg": "ヒント：npxやuvxなどPATH上のコマンドを使用してください（例：npx -y {'@'}modelcontextprotocol/server-filesystem）"
        },
        "title.apiCode": {"msg": "このリクエストのAPIコード"},
        "message.viewCodeHint": {"msg": "このリクエストのAPIコードを表示"},
        "button.viewCode": {"msg": "コードを表示"},
        "button.getApiKey": {"msg": "APIキーを取得"},
        "button.apiPlatform": {"msg": "APIプラットフォーム"},
        "appUpgrade.title": {"msg": "アップデートが必要"},
        "appUpgrade.blockMessage": {
            "msg": "このバージョンはサポートが終了しました。続行するにはApp Storeからアップデートしてください。"
        },
        "appUpgrade.softMessage": {
            "msg": "新しいバージョンが利用可能です。最良のエクスペリエンスのためにApp Storeからアップデートしてください。"
        },
        "appUpgrade.openStore": {"msg": "今すぐアップデート"},
        "nav.digitalhuman": {"msg": "デジタルヒューマン"},
        "settings.localToolsAndroidPermHint": {
            "msg": "アシスタントが画面を見てデバイスを操作できるように、アクセシビリティサービスを有効にしてください。"
        },
        "settings.cuConsentTitle": {"msg": "操作を許可しますか？"},
        "settings.cuConsentMessage": {
            "msg": "アシスタントが「{action}」をスマートフォンで実行しようとしています。許可しますか？"
        },
        "settings.cuConsentAllow": {"msg": "1回許可"},
        "settings.cuConsentAlways": {"msg": "常に許可"},
        "settings.memoryEnabled": {"msg": "メモリを使用"},
        "settings.memoryEnabledHint": {
            "msg": "オフにすると、保存されたメモリは使用されず、新しいチャットではメモリが作成されません。既存のメモリは保持されます。"
        },
        "nav.omni": {"msg": "Omni動画"},
        "settings.memoryImportTitle": {"msg": "他のAIからメモリをインポート"},
        "settings.memoryImportExportStep": {
            "msg": "1. 現在のAIにメモリをエクスポートするよう依頼"
        },
        "settings.memoryImportPrompt": {
            "msg": "別のAIサービスに移行します。あなたが保存したすべてのメモリと永続的なコンテキストを一覧にしてください。"
        },
        "settings.memoryImportCopy": {"msg": "プロンプトをコピー"},
        "settings.memoryImportCopied": {"msg": "コピーしました"},
        "settings.memoryImportPasteStep": {"msg": "2. エクスポートしたメモリを貼り付け"},
        "settings.memoryImportPlaceholder": {
            "msg": "ChatGPT、Claude、Geminiなどから返されたメモリテキストを貼り付けてください…"
        },
        "settings.memoryImportSubmit": {"msg": "メモリに追加"},
        "settings.memoryImportPartial": {
            "msg": "{processed}件を処理しました；{rejected}件の安全でないまたは無効なエントリはスキップされました"
        },
        "settings.memoryImportInvalid": {
            "msg": "メモリをインポートできませんでした。メモリがオンになっていることを確認し、1行に1つの事実を貼り付けてください。"
        },
        "settings.memoryImportInProgress": {
            "msg": "メモリのインポートが既に実行中です。このダイアログを開いたまま、しばらく後にもう一度お試しください。"
        },
    },

    # ─── digitalhuman.json ─────────────────────────────────────────────────
    "digitalhuman.json": {
        "name.taskId": {"msg": "タスクID"},
        "name.elapsed": {"msg": "経過時間"},
        "name.failureReason": {"msg": "失敗の理由"},
        "name.face": {"msg": "顔のソース"},
        "name.voiceReady": {"msg": "音声準備完了"},
        "placeholder.text": {"msg": "アバターに話させたいテキストを入力…"},
        "description.face": {
            "msg": "クリアな正面向きの顔動画（推奨）または1枚の写真をアップロードしてアバターを駆動します。"
        },
        "description.voiceClone": {
            "msg": "クリーンな10〜20秒の音声サンプルをアップロードして音声をクローンし、テキストを読み上げさせます。"
        },
        "button.generate": {"msg": "動画を生成"},
        "button.download": {"msg": "動画をダウンロード"},
        "button.uploadVideo": {"msg": "顔の動画をアップロード"},
        "button.uploadPhoto": {"msg": "顔の写真をアップロード"},
        "button.uploadAudio": {"msg": "音声をアップロード"},
        "button.uploadSample": {"msg": "サンプルをアップロード"},
        "button.clone": {"msg": "音声をクローン"},
        "button.cloning": {"msg": "クローン中…"},
        "message.startingTask": {"msg": "動画タスクを送信中…"},
        "message.startTaskSuccess": {
            "msg": "タスクが送信されました！レンダリングが進むにつれて以下に表示されます。"
        },
        "message.startTaskFailed": {
            "msg": "タスクの送信に失敗しました。再試行してください。"
        },
        "message.usedUp": {"msg": "このリクエストの残高が不足しています。"},
        "message.uploadError": {"msg": "アップロードに失敗しました。再試行してください。"},
        "message.voiceCloneSuccess": {
            "msg": "音声がクローンされました！テキストで動画を生成できます。"
        },
        "message.voiceCloneFailed": {
            "msg": "音声クローンに失敗しました。よりクリーンなサンプルをお試しください。"
        },
    },

    # ─── grokvideo.json ────────────────────────────────────────────────────
    "grokvideo.json": {
        "name.referenceImages": {"msg": "参考画像"},
        "description.referenceImages": {
            "msg": "生成動画のスタイルや内容をガイドするオプションの参考画像（最大4枚）。"
        },
        "message.uploadReferenceExceed": {
            "msg": "参考画像は最大4枚までアップロードできます。"
        },
    },

    # ─── kling.json ────────────────────────────────────────────────────────
    "kling.json": {
        "inspiration.chip.lightSoft": {"msg": "ソフトライト"},
        "inspiration.chip.lightWarm": {"msg": "ウォームライト"},
        "name.referenceVideo": {"msg": "参考動画"},
        "description.referenceVideo": {
            "msg": "kling-video-o1専用。MP4/MOV（720〜2160px、3〜10秒、200MB以下）を1本アップロードして動画を編集または参照できます。"
        },
        "button.uploadReferenceVideo": {"msg": "動画をアップロード"},
        "message.referenceVideoExceed": {
            "msg": "参考動画は最大1本までアップロードできます。"
        },
        "message.referenceVideoError": {
            "msg": "参考動画のアップロードに失敗しました。後でもう一度お試しください。"
        },
        "message.referenceVideoTypeFailed": {
            "msg": "アップロードするファイルはMP4またはMOV形式でなければなりません！"
        },
        "message.referenceVideoSizeExceed": {
            "msg": "アップロードするファイルのサイズは200MB以下でなければなりません！"
        },
    },

    # ─── maestro.json ──────────────────────────────────────────────────────
    "maestro.json": {
        "option.style.glass": {"msg": "フロストガラス"},
        "option.style.swiss": {"msg": "スイスグリッド"},
        "option.style.bold": {"msg": "ボールドタイプ"},
        "option.style.retro": {"msg": "レトロフィルム"},
        "name.primaryLanguage": {"msg": "主要言語"},
        "name.additionalLanguages": {"msg": "追加言語（任意）"},
        "placeholder.additionalLanguages": {"msg": "出力言語を追加"},
    },

    # ─── midjourney.json ───────────────────────────────────────────────────
    "midjourney.json": {
        "styleTag.cloisonne": {"msg": "景泰藍"},
        "styleTag.unrealEngine": {"msg": "アンリアルエンジン"},
        "styleTag.octaneRender": {"msg": "Octaneレンダリング"},
        "styleTag.quixelMegascansRender": {"msg": "Quixel Megascansレンダリング"},
        "styleTag.coronaRender": {"msg": "Coronaレンダリング"},
        "styleTag.suiIshida": {"msg": "石田スイ"},
        "styleTag.porcelain": {"msg": "磁器"},
        "button.medium": {"msg": "鮮明"},
        "button.high": {"msg": "高画質"},
    },

    # ─── omni.json ─────────────────────────────────────────────────────────
    "omni.json": {
        "name.referenceImages": {"msg": "参考画像"},
        "name.referenceVideo": {"msg": "参考動画"},
        "description.referenceVideo": {
            "msg": "オプションのMP4/MOV（200MB以下）で既存の動画を編集または参照できます。参考動画を使用する場合は少なくとも1枚の参考画像が必要です。"
        },
        "button.uploadVideo": {"msg": "動画をアップロード"},
        "message.uploadReferenceExceed": {
            "msg": "参考画像は最大4枚までアップロードできます。"
        },
        "message.uploadVideoExceed": {
            "msg": "参考動画は最大1本までアップロードできます。"
        },
        "message.uploadVideoError": {
            "msg": "参考動画のアップロードに失敗しました。後でもう一度お試しください。"
        },
        "message.uploadVideoTypeFailed": {
            "msg": "アップロードするファイルはMP4またはMOV形式でなければなりません！"
        },
        "message.uploadVideoSizeExceed": {
            "msg": "アップロードするファイルのサイズは200MB以下でなければなりません！"
        },
        "message.promptRequired": {"msg": "プロンプトを入力してください。"},
        "message.videoRequiresImage": {
            "msg": "参考動画を使用する場合は少なくとも1枚の参考画像を追加してください。"
        },
    },

    # ─── order.json ────────────────────────────────────────────────────────
    "order.json": {
        "message.wechatPayMobileGuide": {
            "msg": "モバイルブラウザからは直接WeChat Payを開けません。以下のお支払いリンクをコピーしてください。"
        },
        "button.copyPayLink": {"msg": "支払いリンクをコピー"},
        "message.wechatPayMobileHint": {
            "msg": "コピー後、WeChatを開き、リンクをチャットや検索バーに貼り付けてください。"
        },
        "title.totalOrders": {"msg": "注文総数"},
        "title.totalSpent": {"msg": "合計使用額"},
        "title.finishedOrders": {"msg": "完了した注文"},
        "title.pendingOrders": {"msg": "保留中の注文"},
        "button.export": {"msg": "CSVエクスポート"},
        "field.allStates": {"msg": "すべての状態"},
        "field.allPayWays": {"msg": "すべての支払い方法"},
    },

    # ─── site.json ─────────────────────────────────────────────────────────
    "site.json": {
        "field.authSmsWebhook": {"msg": "カスタムSMS送信者"},
        "message.authSmsWebhookTip": {
            "msg": "有効にすると、このサイトの電話番号確認コードは独自のエンドポイントを通じて送信されます。"
        },
        "placeholder.authSmsWebhookUrl": {"msg": "https://your-domain/sms-webhook"},
        "placeholder.authSmsWebhookSecret": {
            "msg": "署名シークレット（未変更の場合は空白のまま）"
        },
        "field.authSmsWebhookEnable": {"msg": "カスタム送信者を使用"},
        "field.authSmsWebhookDoc": {"msg": "ドキュメントを見る"},
        "message.authSmsWebhookNeedsPhone": {
            "msg": "カスタムSMS送信者を設定するには、まず電話番号ログインプロバイダーを有効にしてください。"
        },
        "field.authSmsWebhookDocTitle": {"msg": "カスタムSMS送信者・Webhook仕様"},
        "message.authSmsWebhookDocIntro": {
            "msg": "このサイトは指定されたURLに署名済みのHTTPS POSTを送信します。あなたのサービスがSMSの送信を担当します。"
        },
        "message.authSmsWebhookDocRequest": {
            "msg": "メソッドPOST、Content-Type: application/json。purposeはlogin/register/resetのいずれかです。"
        },
        "field.authSmsWebhookDocHeaders": {"msg": "署名検証"},
        "message.authSmsWebhookDocHeaders": {
            "msg": "各リクエストには以下のヘッダーが含まれています。署名シークレットを使用してHMAC-SHA256で検証してください。"
        },
        "message.authSmsWebhookDocResponse": {
            "msg": "成功時は2xxを返してください。失敗を明示するには、HTTP 200とJSONレスポンスを返してください。"
        },
        "field.authSmsWebhookTestTitle": {"msg": "カスタムSMS送信者のテスト"},
        "field.authSmsWebhookTestRegion": {"msg": "国/地域コード"},
        "field.authSmsWebhookTestNumber": {"msg": "テスト用電話番号（任意）"},
        "field.authSmsWebhookTestSend": {"msg": "テスト送信"},
        "message.authSmsWebhookTestOk": {
            "msg": "テストリクエストがエンドポイントに正常に送信されました。"
        },
        "message.authSmsWebhookTestFailed": {
            "msg": "テスト失敗。URL、署名シークレット、エンドポイントのレスポンスを確認してください。"
        },
        "field.authSmsWebhookDisableTitle": {"msg": "カスタムSMS送信者を無効化"},
        "message.authSmsWebhookDisableConfirm": {
            "msg": "無効化すると、保存された送信者URLと署名シークレットが削除されます（シークレットは再取得できません）。"
        },
        "field.featuresDigitalhuman": {"msg": "デジタルヒューマン"},
        "capabilityOverride.edit": {"msg": "アプリをカスタマイズ"},
        "capabilityOverride.dialogTitle": {"msg": "「{name}」をカスタマイズ"},
        "capabilityOverride.displayName": {"msg": "カスタム名"},
        "capabilityOverride.displayNameTip": {
            "msg": "空白のままにすると{name}が使用されます。自動翻訳を有効にする前に一度保存してください。"
        },
        "capabilityOverride.icon": {"msg": "カスタムアイコン"},
        "capabilityOverride.replaceIcon": {"msg": "アイコンを置き換え"},
        "capabilityOverride.uploadIcon": {"msg": "アイコンをアップロード"},
        "capabilityOverride.useDefaultIcon": {"msg": "デフォルトアイコンを使用"},
        "capabilityOverride.iconTip": {
            "msg": "PNG、JPEG、またはWebP。画像は正方形にトリミングされます；透明なPNGは保持されます。"
        },
        "capabilityOverride.editIcon": {"msg": "アプリアイコンを編集"},
        "capabilityOverride.resetAll": {"msg": "デフォルトに戻す"},
        "capabilityOverride.empty": {
            "msg": "カスタム名を入力するかアイコンをアップロードしてください。"
        },
        "capabilityOverride.saved": {"msg": "アプリのカスタマイズを保存しました"},
        "capabilityOverride.savedEnableTranslation": {
            "msg": "保存しました。カスタム名の自動翻訳を有効にできるようになりました。"
        },
        "capabilityOverride.saveFailed": {
            "msg": "アプリのカスタマイズの保存に失敗しました"
        },
        "capabilityOverride.resetConfirm": {
            "msg": "「{name}」のデフォルト名とアイコンに戻しますか？"
        },
        "capabilityOverride.resetDone": {"msg": "デフォルト名とアイコンが復元されました"},
        "capabilityOverride.fetchFailed": {
            "msg": "アプリのカスタマイズの読み込みに失敗しました"
        },
    },

    # ─── webextrator.json ──────────────────────────────────────────────────
    "webextrator.json": {
        "name.expectedType": {"msg": "期待する型"},
        "name.enableLlm": {"msg": "LLMクリーンアップ"},
        "name.waitUntil": {"msg": "待機条件"},
        "name.waitForSelector": {"msg": "セレクタを待機"},
        "name.timeout": {"msg": "タイムアウト（秒）"},
        "name.delay": {"msg": "遅延（秒）"},
        "name.blockResources": {"msg": "リソースをブロック"},
        "waitUntil.networkidle": {"msg": "ネットワークアイドル"},
        "waitUntil.domcontentloaded": {"msg": "DOM読み込み完了"},
        "placeholder.waitForSelector": {"msg": "CSSセレクタ（例：.article-body）"},
        "placeholder.blockResources": {"msg": "ブロックするリソースタイプ"},
        "description.intro": {"msg": "ウェブページをレンダリングして抽出"},
        "description.introHint": {
            "msg": "URLを入力し、「抽出」または「レンダリング」を選択してクリーンなコンテンツ、Markdown、リンクなどを取得します。"
        },
        "description.enableLlm": {
            "msg": "LLMを使用して抽出したコンテンツをクリーンアップして構造化します。追加のクレジットが必要です。"
        },
        "message.running": {"msg": "処理中…"},
        "message.extracting": {"msg": "抽出中…"},
        "message.rendering": {"msg": "レンダリング中…"},
        "message.failed": {"msg": "リクエストが失敗しました"},
        "message.usedUp": {
            "msg": "クォータを使い切りました。続けるにはチャージしてください。"
        },
        "message.busy": {
            "msg": "サービスが混雑しています。しばらくしてから再試行してください。"
        },
        "message.timeout": {
            "msg": "ページの読み込みに時間がかかりすぎました。別のURLを試すか、タイムアウトを増やしてください。"
        },
        "tab.raw": {"msg": "生のJSON"},
    },

    # ─── veo.json (upload limit) ───────────────────────────────────────────
    "veo.json": {
        "message.uploadReferencesLimit": {
            "msg": "参考画像は最大{limit}枚までアップロードできます。"
        },
    },
}


def apply_translations() -> dict[str, int]:
    changed: dict[str, int] = {}
    for filename, key_patches in TRANSLATIONS.items():
        filepath = JA_DIR / filename
        if not filepath.exists():
            print(f"WARN: {filepath} does not exist, skipping")
            continue
        data = json.loads(filepath.read_text(encoding="utf-8"))
        count = 0
        for key, patch in key_patches.items():
            if key not in data:
                # Key may be missing — create minimal entry
                data[key] = {}
            entry = data[key]
            if not isinstance(entry, dict):
                continue
            if "msg" in patch and patch["msg"] is not None:
                if entry.get("message") != patch["msg"]:
                    entry["message"] = patch["msg"]
                    count += 1
            if "desc" in patch and patch["desc"] is not None:
                if entry.get("description") != patch["desc"]:
                    entry["description"] = patch["desc"]
                    count += 1
        filepath.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        if count:
            changed[filename] = count
            print(f"  {filename}: {count} field(s) updated")
    return changed


if __name__ == "__main__":
    print("Applying Japanese translations…")
    totals = apply_translations()
    total_changes = sum(totals.values())
    print(f"\nDone: {len(totals)} file(s) modified, {total_changes} field(s) updated.")
