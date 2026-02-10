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

export function convertToMLTI(M, L, T, I) {

  const m = Number(M);
  const l = Number(L);
  const t = Number(T);
  const i = Number(I);

  let MLTIHTMLString = "";
  if (m !== 0) {
    MLTIHTMLString += `M<sup>${formatIndicateForSup(m)}</sup>`;
  }
  if (l !== 0) {
    MLTIHTMLString += `L<sup>${formatIndicateForSup(l)}</sup>`;
  }
  if (t !== 0) {
    MLTIHTMLString += `T<sup>${formatIndicateForSup(t)}</sup>`;
  }
  if (i !== 0) {
    MLTIHTMLString += `I<sup>${formatIndicateForSup(i)}</sup>`;
  }

  if (m === 0 && l === 0 && t === 0 && i === 0) {
    MLTIHTMLString = 'L<sup>0</sup>T<sup>0</sup>';
  }

  if (m === undefined || l === undefined || t === undefined || i === undefined) {
    MLTIHTMLString = ""
  }

  if (isNaN(m) || isNaN(l) || isNaN(t) || isNaN(i)) {
    MLTIHTMLString = ""
  }

  return MLTIHTMLString;
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
