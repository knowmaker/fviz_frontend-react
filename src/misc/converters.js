import { EditorState, ContentState } from "draft-js";
import htmlToDraft from "html-to-draftjs";


export function convertMarkdownToEditorState(stateFunction, markdown) {

  const markdownNotNull = typeof markdown === "string" ? markdown : "";
  const blocksFromHtml = htmlToDraft(markdownNotNull);
  const { contentBlocks, entityMap } = blocksFromHtml;
  const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
  stateFunction(EditorState.createWithContent(contentState));

}


export function formatIndicateForSup(value) {
  const numberValue = Number(value);
  const doubledValue = numberValue * 2;
  if (doubledValue % 2 === 0) {
    return `${doubledValue / 2}`;
  }
  return `${doubledValue}/2`;
}

export function convertToMLTI(M, L, T, I, orderliness) {


  const m = Number(M);
  const l = Number(L);
  const t = Number(T);
  const i = Number(I);

  const values = { M: m, L: l, T: t, I: i };

  let mltiHtmlString = "";
  const order = typeof orderliness === "string" ? orderliness.split("") : [];
  for (const letter of order) {
    const value = values[letter];
    if (value !== 0) {
      mltiHtmlString += `${letter}<sup>${formatIndicateForSup(value)}</sup>`;
    }
  }

  if (m === 0 && l === 0 && t === 0 && i === 0) {
    mltiHtmlString = 'L<sup>0</sup>T<sup>0</sup>';

  }
  if (m === undefined || l === undefined || t === undefined || i === undefined) {
    return "";
  }
  if (isNaN(m) || isNaN(l) || isNaN(t) || isNaN(i)) {
    return "";
  }

  return mltiHtmlString;
}



export function convertNumberToUnicodePower(number) {
  const numberString = number.toString()
  const unicodeString = numberString.replace("0", "⁰")
  .replace("1", "¹").replace("2", "²").replace("3", "³")
  .replace("4", "⁴").replace("5", "⁵").replace("6", "⁶")
  .replace("7", "⁷").replace("8", "⁸").replace("9", "⁹")
  .replace("-", "⁻").replace("/", "⁄")
  return unicodeString
}
