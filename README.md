Type error: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
  18 |     >
  19 |       <FilloutStandardEmbed
> 20 |         filloutId={env.FILLOUT_SUBSCRIBER_FORM}
     |         ^
  21 |         dynamicResize
  22 |       />
  23 |     </div>



  "use client";

import { FilloutStandardEmbed } from "@fillout/react";

import { env } from "@/lib/env";

export default function Newsletter() {
  const filloutId = env.FILLOUT_SUBSCRIBER_FORM;

  return (
    <div
      id="subscribe-section"
      className="scroll-mt-32"
      style={{
        width: "100%",
        borderRadius: "0px",
      }}
    >
      <FilloutStandardEmbed
        filloutId={env.FILLOUT_SUBSCRIBER_FORM}
        dynamicResize
      />
    </div>
  );
}
