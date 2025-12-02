import { JSDOM } from "jsdom";

// All invisible characters you want to remove
const INVISIBLE_CHARS =
    "\u200b" + // zero-width space
    "\u200c" + // zero-width non-joiner
    "\u200d" + // zero-width joiner
    "\u2060" + // word joiner
    "\u2061" + // function application
    "\u2062" + // invisible times
    "\u2063" + // invisible separator
    "\u2064";  // invisible plus

const INVISIBLE_REGEX = new RegExp("[" + INVISIBLE_CHARS + "]", "g");

function cleanInvisible(text: string): string {
    return text.replace(INVISIBLE_REGEX, "").trim();
}

// ---------------------------------------------------

export interface HtmlNode {
    tag: string | null;
    properties: Record<string, string>;
    content: string;
    children: HtmlNode[];
}

export function extractHtmlStructure(htmlString: string): HtmlNode[] {
    const dom = new JSDOM(htmlString);
    const document = dom.window.document;

    function processNode(node: Node): HtmlNode | null {
        // TEXT NODE
        if (node.nodeType === dom.window.Node.TEXT_NODE) {
            const text = cleanInvisible(node.textContent || "");
            if (!text) return null;

            return {
                tag: null,
                properties: {},
                content: text,
                children: []
            };
        }

        // ELEMENT NODE
        if (node.nodeType !== dom.window.Node.ELEMENT_NODE) {
            return null;
        }

        const el = node as Element;

        const obj: HtmlNode = {
            tag: el.tagName.toLowerCase(),
            properties: {},
            content: cleanInvisible(el.textContent || ""),
            children: []
        };

        // Extract attributes
        for (const attr of Array.from(el.attributes)) {
            obj.properties[attr.name] = attr.value;
        }

        // Process children
        el.childNodes.forEach(child => {
            const c = processNode(child);
            if (c) obj.children.push(c);
        });

        return obj;
    }

    const result: HtmlNode[] = [];
    document.body.childNodes.forEach(node => {
        const processed = processNode(node);
        if (processed) result.push(processed);
    });

    return result;
}
