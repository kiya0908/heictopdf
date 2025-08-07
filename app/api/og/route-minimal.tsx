import { ImageResponse } from "@vercel/og"

import { ogImageSchema } from "@/lib/validations/og"

export const runtime = "edge"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const values = ogImageSchema.parse(Object.fromEntries(url.searchParams))
    const heading =
      values.heading.length > 80
        ? `${values.heading.substring(0, 100)}...`
        : values.heading

    const { mode } = values
    const paint = mode === "dark" ? "#fff" : "#000"
    const fontSize = heading.length > 80 ? "60px" : "80px"

    return new ImageResponse(
      (
        <div
          tw="flex relative flex-col p-12 w-full h-full items-start"
          style={{
            color: paint,
            background:
              mode === "dark"
                ? "linear-gradient(90deg, #000 0%, #111 100%)"
                : "white",
          }}
        >
          <div
            tw="text-5xl font-bold"
            style={{
              background: "linear-gradient(90deg, #6366f1, #a855f7 80%)",
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            HEIC to PDF
          </div>

          <div tw="flex flex-col flex-1 py-16">
            <div tw="flex text-xl uppercase font-bold tracking-tight">
              {values.type}
            </div>
            <div
              tw="flex leading-[1.15] font-bold"
              style={{
                marginLeft: "-3px",
                fontSize,
              }}
            >
              {heading}
            </div>
          </div>

          <div tw="flex items-center w-full justify-center">
            <div tw="flex items-center text-xl">
              <div tw="flex">heictopdf.com</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}