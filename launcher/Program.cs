using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("Rechner")]
[assembly: AssemblyProduct("Rechner")]
[assembly: AssemblyDescription("Lokaler Rechner")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace Rechner
{
    internal static class Program
    {
        internal static string LibDir;
        private static string WwwDir;

        private static readonly string[] WebFiles = new string[]
        {
            "index.html",
            "favicon.ico",
            "css\\app.css",
            "js\\units.js",
            "js\\engine.js",
            "js\\app.js"
        };

        [STAThread]
        private static int Main()
        {
            try
            {
                string root = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Rechner");
                string buildId = ReadTextResource("Rechner.build.txt").Trim();
                LibDir = Path.Combine(root, "lib", buildId);
                WwwDir = Path.Combine(root, "www");
                ExtractLibs();
                ExtractWeb(buildId);
                AppDomain.CurrentDomain.AssemblyResolve += ResolveLibrary;
                SetProcessDpiAwarenessContext(new IntPtr(-4));
                Host.Run();
                return 0;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Der Rechner konnte nicht gestartet werden.\n\n" + ex.Message,
                    "Rechner",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return 1;
            }
        }

        private static Assembly ResolveLibrary(object sender, ResolveEventArgs args)
        {
            string name = new AssemblyName(args.Name).Name;
            if (name != "Microsoft.Web.WebView2.Core" && name != "Microsoft.Web.WebView2.WinForms") return null;
            string path = Path.Combine(LibDir, name + ".dll");
            if (!File.Exists(path)) return null;
            return Assembly.LoadFrom(path);
        }

        private static void ExtractLibs()
        {
            Directory.CreateDirectory(LibDir);
            WriteResource("Rechner.lib.Microsoft.Web.WebView2.Core.dll", Path.Combine(LibDir, "Microsoft.Web.WebView2.Core.dll"));
            WriteResource("Rechner.lib.Microsoft.Web.WebView2.WinForms.dll", Path.Combine(LibDir, "Microsoft.Web.WebView2.WinForms.dll"));
            WriteResource("Rechner.lib.WebView2Loader.dll", Path.Combine(LibDir, "WebView2Loader.dll"));
            WriteResource("Rechner.app.ico", Path.Combine(LibDir, "rechner.ico"));
        }

        private static void ExtractWeb(string buildId)
        {
            string stampPath = Path.Combine(WwwDir, ".build");
            if (File.Exists(stampPath) && File.ReadAllText(stampPath).Trim() == buildId && WebFilesPresent()) return;
            Directory.CreateDirectory(WwwDir);
            for (int i = 0; i < WebFiles.Length; i++)
            {
                string relative = WebFiles[i];
                string dest = Path.Combine(WwwDir, relative);
                string directory = Path.GetDirectoryName(dest);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                WriteResource("Rechner." + relative.Replace('\\', '.').Replace('/', '.'), dest);
            }
            File.WriteAllText(stampPath, buildId, Encoding.ASCII);
        }

        private static bool WebFilesPresent()
        {
            for (int i = 0; i < WebFiles.Length; i++)
            {
                if (!File.Exists(Path.Combine(WwwDir, WebFiles[i]))) return false;
            }
            return true;
        }

        private static void WriteResource(string logicalName, string dest)
        {
            using (Stream stream = OpenResource(logicalName))
            using (FileStream file = new FileStream(dest, FileMode.Create, FileAccess.Write, FileShare.Read))
            {
                byte[] buffer = new byte[81920];
                int read;
                while ((read = stream.Read(buffer, 0, buffer.Length)) > 0) file.Write(buffer, 0, read);
            }
        }

        private static string ReadTextResource(string logicalName)
        {
            using (Stream stream = OpenResource(logicalName))
            using (var reader = new StreamReader(stream, Encoding.UTF8))
            {
                return reader.ReadToEnd();
            }
        }

        private static Stream OpenResource(string logicalName)
        {
            Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(logicalName);
            if (stream == null)
            {
                string[] names = Assembly.GetExecutingAssembly().GetManifestResourceNames();
                throw new InvalidOperationException(
                    "Fehlende Ressource " + logicalName + ". Vorhanden: " + string.Join(", ", names));
            }
            return stream;
        }

        [DllImport("user32.dll")]
        private static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    }

    internal static class Host
    {
        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

        public static void Run()
        {
            CoreWebView2Environment.SetLoaderDllFolderPath(Program.LibDir);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        private sealed class MainForm : Form
        {
            private readonly WebView2 web;
            private bool browserReady;

            public MainForm()
            {
                Text = "Rechner";
                FormBorderStyle = FormBorderStyle.None;
                StartPosition = FormStartPosition.CenterScreen;
                MinimumSize = new Size(320, 500);
                ClientSize = new Size(320, 533);
                BackColor = Color.FromArgb(32, 32, 32);
                string iconPath = Path.Combine(Program.LibDir, "rechner.ico");
                if (File.Exists(iconPath)) Icon = new Icon(iconPath);
                web = new WebView2();
                web.Dock = DockStyle.Fill;
                web.DefaultBackgroundColor = Color.FromArgb(32, 32, 32);
                Controls.Add(web);
            }

            protected override void OnHandleCreated(EventArgs e)
            {
                base.OnHandleCreated(e);
                int corner = 2;
                DwmSetWindowAttribute(Handle, 33, ref corner, 4);
            }

            protected override async void OnShown(EventArgs e)
            {
                base.OnShown(e);
                try
                {
                    string profile = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "Rechner",
                        "webview");
                    Directory.CreateDirectory(profile);
                    CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, profile);
                    await web.EnsureCoreWebView2Async(environment);
                    CoreWebView2 core = web.CoreWebView2;
                    core.Settings.AreDefaultContextMenusEnabled = false;
                    core.Settings.AreDevToolsEnabled = false;
                    core.Settings.IsStatusBarEnabled = false;
                    core.Settings.IsZoomControlEnabled = false;
                    core.WebMessageReceived += OnWebMessage;
                    core.SetVirtualHostNameToFolderMapping(
                        "app.rechner",
                        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Rechner", "www"),
                        CoreWebView2HostResourceAccessKind.Allow);
                    core.NavigationCompleted += delegate
                    {
                        if (web.CoreWebView2 != null)
                        {
                            web.CoreWebView2.ExecuteScriptAsync("document.documentElement.classList.add('hosted')");
                        }
                    };
                    browserReady = true;
                    core.Navigate("https://app.rechner/index.html");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "Der Rechner konnte nicht gestartet werden.\n\n" + ex.Message,
                        "Rechner",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    Close();
                }
            }

            protected override void OnResize(EventArgs e)
            {
                base.OnResize(e);
                if (!browserReady || web.CoreWebView2 == null) return;
                string script = WindowState == FormWindowState.Maximized
                    ? "document.documentElement.classList.add('maximized')"
                    : "document.documentElement.classList.remove('maximized')";
                web.CoreWebView2.ExecuteScriptAsync(script);
            }

            private void OnWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs args)
            {
                string message;
                try { message = args.TryGetWebMessageAsString(); }
                catch (Exception) { return; }
                if (message == "min") WindowState = FormWindowState.Minimized;
                else if (message == "max") WindowState = WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized;
                else if (message == "close") Close();
                else if (message == "drag")
                {
                    ReleaseCapture();
                    SendMessage(Handle, 0xA1, new IntPtr(2), IntPtr.Zero);
                }
            }

            protected override void WndProc(ref Message m)
            {
                const int WM_NCHITTEST = 0x84;
                const int HTCLIENT = 1;
                const int HTLEFT = 10;
                const int HTRIGHT = 11;
                const int HTTOP = 12;
                const int HTTOPLEFT = 13;
                const int HTTOPRIGHT = 14;
                const int HTBOTTOM = 15;
                const int HTBOTTOMLEFT = 16;
                const int HTBOTTOMRIGHT = 17;
                if (m.Msg == WM_NCHITTEST && WindowState != FormWindowState.Maximized)
                {
                    base.WndProc(ref m);
                    if ((int)m.Result == HTCLIENT)
                    {
                        int packed = unchecked((int)m.LParam.ToInt64());
                        int x = unchecked((short)(packed & 0xFFFF));
                        int y = unchecked((short)((packed >> 16) & 0xFFFF));
                        Point point = PointToClient(new Point(x, y));
                        int grip = 6;
                        bool left = point.X < grip;
                        bool right = point.X >= ClientSize.Width - grip;
                        bool top = point.Y < grip;
                        bool bottom = point.Y >= ClientSize.Height - grip;
                        if (top && left) m.Result = (IntPtr)HTTOPLEFT;
                        else if (top && right) m.Result = (IntPtr)HTTOPRIGHT;
                        else if (bottom && left) m.Result = (IntPtr)HTBOTTOMLEFT;
                        else if (bottom && right) m.Result = (IntPtr)HTBOTTOMRIGHT;
                        else if (left) m.Result = (IntPtr)HTLEFT;
                        else if (right) m.Result = (IntPtr)HTRIGHT;
                        else if (top) m.Result = (IntPtr)HTTOP;
                        else if (bottom) m.Result = (IntPtr)HTBOTTOM;
                    }
                    return;
                }
                base.WndProc(ref m);
            }
        }
    }
}
