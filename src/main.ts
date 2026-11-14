import "./ui/styles/tokens.css";
import "./ui/styles/base.css";
import "./ui/styles/telas.css";
import { iniciarOceano } from "./ui/components/oceano";
import { iniciarRoteador } from "./ui/router";
import { telaComoJogar } from "./ui/screens/comoJogar";
import { telaInicio } from "./ui/screens/home";
import { telaJogo } from "./ui/screens/jogo";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("#app não encontrado");

const oceano = document.querySelector<HTMLElement>(".oceano");
if (oceano) iniciarOceano(oceano);

iniciarRoteador(app, {
  "#inicio": telaInicio,
  "#diario": telaJogo("diario"),
  "#ilimitado": telaJogo("ilimitado"),
  "#como-jogar": telaComoJogar,
});
