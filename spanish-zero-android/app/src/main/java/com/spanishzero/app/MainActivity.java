package com.spanishzero.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    private static final String RELEASES_URL = "https://api.github.com/repos/Anfascomua/spanish-zero-app/releases/latest";
    private static final long UPDATE_CHECK_INTERVAL_MS = 12L * 60L * 60L * 1000L;
    private TextToSpeech tts;
    private WebView webView;
    private boolean ttsReady;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        getWindow().setNavigationBarColor(Color.WHITE);
        tts = new TextToSpeech(this, this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new TtsBridge(), "AndroidTTS");
        webView.loadUrl("file:///android_asset/index.html");
        checkForUpdate();
    }

    @Override public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS && tts != null) {
            ttsReady = true;
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { }
                @Override @Deprecated public void onError(String id) { }
                @Override public void onError(String id, int code) { }
            });
        }
    }

    private void checkForUpdate() {
        SharedPreferences prefs = getSharedPreferences("updates", MODE_PRIVATE);
        if (System.currentTimeMillis() - prefs.getLong("last_check", 0) < UPDATE_CHECK_INTERVAL_MS) return;
        prefs.edit().putLong("last_check", System.currentTimeMillis()).apply();
        new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(RELEASES_URL).openConnection();
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "SpanishZero-Android");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return;
                StringBuilder body = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    String line; while ((line = reader.readLine()) != null) body.append(line);
                }
                JSONObject release = new JSONObject(body.toString());
                int releaseCode = releaseCode(release.optString("tag_name"));
                String assetUrl = apkUrl(release.optJSONArray("assets"));
                if (releaseCode > currentVersionCode() && assetUrl != null) runOnUiThread(() -> showUpdateDialog(release.optString("name", release.optString("tag_name")), assetUrl));
            } catch (Exception ignored) { }
        }).start();
    }

    private int currentVersionCode() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; }
        catch (Exception ignored) { return 0; }
    }
    private int releaseCode(String tag) {
        try { return Integer.parseInt(tag.replaceFirst("^[vV]", "").replaceAll("[^0-9]", "")); }
        catch (Exception ignored) { return 0; }
    }
    private String apkUrl(JSONArray assets) {
        if (assets == null) return null;
        for (int i = 0; i < assets.length(); i++) {
            String url = assets.optJSONObject(i).optString("browser_download_url");
            if (url.toLowerCase(Locale.ROOT).endsWith(".apk")) return url;
        }
        return null;
    }
    private void showUpdateDialog(String version, String url) {
        new AlertDialog.Builder(this).setTitle("Доступно обновление")
            .setMessage("Вышла версия " + version + ". Скачать APK с GitHub?")
            .setNegativeButton("Позже", null)
            .setPositiveButton("Скачать", (dialog, which) -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)))).show();
    }

    private class TtsBridge {
        @JavascriptInterface public void speak(final String text) {
            runOnUiThread(() -> { if (tts != null && ttsReady) {
                tts.stop(); tts.setLanguage(new Locale("es", "ES")); tts.setSpeechRate(0.82f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "spanish_zero");
            }});
        }
    }
    @Override public void onBackPressed() { if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { if (tts != null) { tts.stop(); tts.shutdown(); } if (webView != null) webView.destroy(); super.onDestroy(); }
}
