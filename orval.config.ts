import { defineConfig } from "orval";
import { loadEnv } from "vite";

// orval CLI 는 .env 를 자동 로드하지 않으므로 vite 의 loadEnv 로 직접 읽는다.
//
// MODE: 실행 시점의 "프로세스 환경변수"다 (.env 파일 변수가 아님).
//   package.json 의 api:gen 계열 스크립트에서 주입한다.
//   - 미지정(기본) → "development": .env (+ .env.local) 로드 → localhost
//   - "deploy"            : .env + .env.deploy 로드 (뒤가 덮어씀) → 실제 배포 URL
//   loadEnv(mode) 는 .env, .env.local, .env.[mode], .env.[mode].local 을 읽으며
//   .env.[mode] 가 있으면 그 값이 .env 를 덮어쓴다.
const mode = process.env.MODE ?? "development";
const env = loadEnv(mode, process.cwd(), "VITE_");
const apiBaseUrl = env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL 이 설정되지 않았습니다. .env 를 확인하세요 (.env.example 참고).",
  );
}

export default defineConfig({
  nodi: {
    input: `${apiBaseUrl}/docs`,
    output: {
      mode: "tags-split",
      target: "src/shared/api/endpoints",
      schemas: "src/shared/api/model",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "src/shared/api/http-client.ts",
          name: "customInstance",
        },
        // useQuery/useMutation을 강제하지 않으면 orval이 HTTP 메서드로 자동 판단한다.
        // GET -> useQuery, POST/PATCH/DELETE -> useMutation
        query: {
          signal: true,
        },
      },
    },
    // fix-model-barrel: orval tags-split 배럴 누락 버그를 매 코드젠 후 자가 복구한다.
    hooks: {
      afterAllFilesWrite: [
        "node ./scripts/fix-model-barrel.mjs",
        "prettier --write",
      ],
    },
  },
});
