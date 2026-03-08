import { NextResponse } from "next/server";

const REPO = "noammarom609/Dvirius";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") || "win";

  try {
    // Fetch latest release from GitHub API
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 }, // Cache for 5 min
      }
    );

    if (!res.ok) {
      // Fallback to releases page
      return NextResponse.redirect(
        `https://github.com/${REPO}/releases/latest`
      );
    }

    const release = await res.json();
    const assets = release.assets || [];

    // Find the right asset based on platform
    let asset;
    if (platform === "win") {
      asset = assets.find(
        (a: { name: string }) =>
          a.name.endsWith(".exe") && !a.name.includes("blockmap")
      );
    } else if (platform === "mac") {
      asset = assets.find((a: { name: string }) => a.name.endsWith(".dmg"));
    } else if (platform === "linux") {
      asset = assets.find((a: { name: string }) =>
        a.name.endsWith(".AppImage")
      );
    }

    if (asset) {
      return NextResponse.redirect(asset.browser_download_url);
    }

    // Fallback
    return NextResponse.redirect(
      `https://github.com/${REPO}/releases/latest`
    );
  } catch {
    return NextResponse.redirect(
      `https://github.com/${REPO}/releases/latest`
    );
  }
}
