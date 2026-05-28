This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

이 프로젝트는 시크릿(Supabase 키 등)을 1Password로 주입합니다. 개발 서버는
아래 명령으로 실행하세요 (`npm run dev`가 자동으로 `op run`을 거칩니다).

```bash
npm run dev
```

사전 조건: 셸에 `OP_SERVICE_ACCOUNT_TOKEN`이 export 돼 있어야 합니다 (`~/.zshrc`).
값은 `.env.1password`의 `op://` 참조로 해석됩니다.

> 1Password 없이(예: env가 이미 셸에 있는 경우) 띄우려면 `npm run dev:plain`.
> 단, Supabase 키가 없으면 `/data` 등에서 500 에러가 납니다.

서버 실행 전 포트 충돌을 확인하세요: `lsof -ti:3000` 으로 점유 프로세스가 있으면
정리한 뒤 단일 인스턴스만 띄웁니다.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
