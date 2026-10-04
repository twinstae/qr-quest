import { clipboard } from "./clipboard";
import { fileUpload } from "./file-upload";
import { badge } from "./badge";
import { collapsible } from "./collapsible";
import { checkbox } from "./checkbox";
import { dialog } from "./dialog";
import { field } from "./field";
import { fieldset } from "./fieldset";
import { input } from "./input";
import { table } from "./table";
import { card } from "./card";
import { spinner } from "./spinner";
import { absoluteCenter } from "./absolute-center";
import { group } from "./group";
import { button } from "./button";
import { revealAnimation } from "./reveal-animation";
export const recipes = {
  button,
  group,
  absoluteCenter,
  spinner,
  input,
  badge,
  revealAnimation,
};

// defineSlotRecipe로 정의한 레시피는 slotRecipes에 등록해야 v2 codegen이
// slots를 포함해 생성한다 (recipes에 넣으면 base/slots가 빠진 cva로 생성됨).
export const slotRecipes = {
  card,
  dialog,
  table,
  fieldset,
  field,
  checkbox,
  collapsible,
  fileUpload,
  clipboard,
};
