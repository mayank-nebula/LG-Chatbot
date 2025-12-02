const { JSDOM } = require("jsdom");

function extractHtmlStructure(htmlString) {
    const dom = new JSDOM(htmlString);
    const document = dom.window.document;

    function processNode(node) {
        // Text node
        if (node.nodeType === 3) {
            const text = node.textContent.trim();
            if (!text) return null;
            return { tag: null, properties: {}, content: text, children: [] };
        }

        // Skip non-element nodes
        if (node.nodeType !== 1) return null;

        let obj = {
            tag: node.tagName.toLowerCase(),
            properties: {},
            content: node.textContent.trim(),
            children: []
        };

        // Extract attributes
        for (let attr of node.attributes) {
            obj.properties[attr.name] = attr.value;
        }

        // Recursively handle children
        node.childNodes.forEach(child => {
            const c = processNode(child);
            if (c) obj.children.push(c);
        });

        return obj;
    }

    const result = [];
    document.body.childNodes.forEach(n => {
        const processed = processNode(n);
        if (processed) result.push(processed);
    });

    return result;
}
