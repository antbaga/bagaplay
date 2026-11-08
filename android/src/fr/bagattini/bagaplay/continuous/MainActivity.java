package fr.bagattini.bagaplay.continuous;
import android.app.Activity;import android.os.Bundle;import android.webkit.*;import android.net.Uri;import android.view.*;import android.widget.FrameLayout;import android.content.*;import android.window.OnBackInvokedDispatcher;import java.io.*;import java.util.*;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state){super.onCreate(state);FrameLayout root=new FrameLayout(this);setContentView(root);
 root.setOnApplyWindowInsetsListener((v,insets)->{android.graphics.Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(i.left,i.top,i.right,i.bottom);return insets;});
 web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);web.setWebChromeClient(new WebChromeClient());
 web.setWebViewClient(new WebViewClient(){
 @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){if("appassets.androidplatform.net".equals(r.getUrl().getHost()))return false;if(r.isForMainFrame()&&"https".equals(r.getUrl().getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,r.getUrl()));}catch(Exception e){}}return true;}
 @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(!"appassets.androidplatform.net".equals(u.getHost()))return null;String path=u.getPath();if(path==null||!path.startsWith("/assets/")||path.contains(".."))return missing();String f=path.substring(8);String mime=f.endsWith(".html")?"text/html":f.endsWith(".css")?"text/css":f.endsWith(".js")?"application/javascript":f.endsWith(".svg")?"image/svg+xml":f.endsWith(".png")?"image/png":"application/octet-stream";try{return new WebResourceResponse(mime,"UTF-8",getAssets().open(f));}catch(IOException e){return missing();}}
 });
 web.addJavascriptInterface(new Saves(),"BagaNative");if(android.os.Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->back());web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");root.requestApplyInsets();
 }
 public class Saves {
 @JavascriptInterface public void saveRun(String key,String data){if(key!=null&&key.startsWith("bagaplay-")&&data!=null)getSharedPreferences("runs",MODE_PRIVATE).edit().putString(key,data).commit();}
 @JavascriptInterface public String loadRun(String key){return key!=null&&key.startsWith("bagaplay-")?getSharedPreferences("runs",MODE_PRIVATE).getString(key,""):"";}
 @JavascriptInterface public void clearRun(String key){if(key!=null&&key.startsWith("bagaplay-"))getSharedPreferences("runs",MODE_PRIVATE).edit().remove(key).commit();}
 }
 private WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private void back(){if(web.canGoBack())web.goBack();else new android.app.AlertDialog.Builder(this).setMessage("Quitter BagaPlay ? Votre partie est sauvegardée automatiquement.").setPositiveButton("Quitter",(d,w)->finish()).setNegativeButton("Continuer",null).show();}
 @Override public void onBackPressed(){back();}
 @Override protected void onPause(){web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))",null);super.onPause();}
 @Override protected void onDestroy(){web.removeJavascriptInterface("BagaNative");web.destroy();super.onDestroy();}
}