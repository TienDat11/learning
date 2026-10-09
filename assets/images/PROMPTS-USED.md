# Bộ prompt tạo hình bài học

Công cụ: imagegen tích hợp (built-in). 23 PNG ngang 1536 × 1024. L01 được dùng làm tham chiếu phong cách cho các bài còn lại.

Dưới đây là đặc tả gốc đã bổ sung đối chiếu bài học và các lệnh chỉnh sửa áp dụng. Các điều chỉnh quan hệ/đường nối được ưu tiên khi mâu thuẫn với mô tả ban đầu. Đây là sơ đồ minh họa khái niệm, không phải biểu đồ cấu hình triển khai đầy đủ.

## L01 — Đọc một kiến trúc serverless từ trái sang phải

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how a request flows through a serverless system and where the shared-responsibility line sits, read strictly left to right. Five labelled objects sit on a clean base plate: (1) a browser window, (2) an arched gate, (3) a large glowing cube drawn three times larger and brighter than everything else, the hero of the image, then two objects fanning out to the right, (4) a database cylinder, (5) a conveyor belt. One glowing blue rail joins the first three in a row, carrying large blue numerals 1, 2 and 3; at the glowing cube the rail splits into two separate branches, the upper branch running to the database cylinder and the lower branch to the conveyor belt, carrying large blue numerals 4 and 5. A thin dashed horizontal line runs the full width of the scene just above the base plate surface; all five objects sit above that line, and the base plate below it is plain matte grey. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "BROWSER", "API GATEWAY", "LAMBDA", "DYNAMODB", "SQS". Render these two further labels exactly once each, at the left end of the dashed horizontal line, one just above it and one just below it: "WHAT YOU OWN", "WHAT AWS OWNS". No other text or numerals beyond the labels listed above and the blue numerals 1 to 5, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Keep precisely the original five objects. Main call rail is BROWSER -> API GATEWAY -> LAMBDA with blue stage numerals 1,2,3. Two unnumbered outgoing branches from LAMBDA go separately to DYNAMODB and SQS: these are not sequential stages 4/5. Show upper application/configuration layer and lower provider-managed infrastructure as a conceptual ownership split, not a claim the customer operates AWS service hardware.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L02 — IAM: hai lớp quyền của một hệ thống serverless

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how two independent permission layers gate one request, read strictly left to right. Five labelled objects sit on a clean base plate. Three sit on the main glowing blue rail: (1) an arched gatehouse, the caller, (2) a turnstile with a keycard reader standing immediately behind it, the invoke gate, (3) a large glowing cube, the running function, the hero, drawn twice as large and brighter. Large blue numerals 1 and 2 sit on the main rail, one before each crossing. Two objects sit off the main rail on short unnumbered spurs behind the cube: a heavy circular vault door with a spoked wheel, and a stack of sealed service crates behind it. A wall panel holding a rack of five keys with exactly one key glowing hangs above and between the two gates, and two thin lines leave it, one down to the turnstile and one down to the vault door. Rejected keycards pile on a broken red spur before the turnstile. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "API GATEWAY", "INVOKE PERMISSION", "LAMBDA", "EXECUTION ROLE", "POLICY", "AWS RESOURCES". No other text or numerals beyond the labels listed above and the blue numerals 1 to 2, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): There are SIX labelled objects, not five. Show API GATEWAY -> INVOKE PERMISSION -> LAMBDA -> EXECUTION ROLE -> AWS RESOURCES; POLICY is a separate thin grey association to both permission checks. The invoke permission belongs on the Lambda resource boundary; execution role controls outgoing resource calls. Only numerals 1 and 2 at the two distinct permission checks.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L03 — Lambda: handler, cold start, concurrency và retry

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how Lambda runs one event through cold start and retry while concurrency and timeout bound it from the side, read strictly left to right. Four labelled objects sit on the main glowing blue rail: (1) a paper envelope, (2) a single pod frosted white with a thin frost halo, (3) a rack of identical warm pods, the hero, drawn three times larger and brighter, (4) a parcel carrying a single wax seal, with a short red rail segment looping back from the parcel toward the envelope. Large blue numerals 1 to 4 sit on the main rail. Two labelled objects sit on short unnumbered spurs beside the hero: a turnstile fitted with a small counter with extra envelopes piled behind it, and an amber gauge pinned at its maximum clipped to one warm pod. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "EVENT", "COLD START", "LAMBDA", "CONCURRENCY", "TIMEOUT", "RETRY". No other text or numerals beyond the labels listed above and the blue numerals 1 to 4, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Cold start is conditional, not performed for every event: from EVENT have two clear alternatives, a short warm path directly to LAMBDA and a path through COLD START joining the same LAMBDA. RETRY is a red conditional failed-event return loop, not an inevitable success stage. CONCURRENCY and TIMEOUT are side controls. No additional labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L04 — API Gateway: cổng vào và nơi chặn request rác

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how API Gateway admits good requests through route, auth and throttle in order, read strictly left to right. Six labelled objects sit on a clean base plate. Five sit in one row joined by a single glowing blue rail: (1) a paper envelope, (2) a signpost forking into three branches, (3) a shield, (4) a narrowing valve fitted with a round pressure gauge, (5) a large glowing cube standing behind the gate. Large blue numerals 1 to 5 sit on the rail between the objects. The valve is the hero, drawn twice as large and brighter, with three small tier marks along its side. Above the row sits the sixth object on a short unnumbered spur: two interlocking brackets meeting in the middle. Rejected envelopes pile on a broken red rail spur with curled ends. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "REQUEST", "ROUTES", "AUTH", "THROTTLE", "LAMBDA", "CORS". No other text or numerals beyond the labels listed above and the blue numerals 1 to 5, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Treat ROUTES, AUTH, THROTTLE as schematic gateway controls, not an assertion of a universal AWS internal execution order. CORS is a separate browser-access concern, grey association not another backend call. Keep all six labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L05 — S3 presigned URL và DynamoDB: dữ liệu to, truy vấn rẻ

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how a ticketed upload bypasses the API, and why a keyed read is cheap while a full scan is not, split into two halves. A thin dashed vertical divider separates the base plate. Left half, labelled UPLOAD, read left to right with blue numerals 1 to 3 sitting on the rail: (1) a block building with its doors shut, (2) a small glowing signed pass ringed by a draining timer, (3) a large vault with a circular door, while a single file icon rides an elevated rail that arcs high over the building and drops straight into the vault. Right half, labelled QUERY, carries no numerals: a tall card-catalog cabinet at the centre, with two branches leaving it, one to a single drawer slid out holding one glowing card, the other to a pile of drawers yanked open and scattered on the floor, glowing red. The vault is the hero, drawn twice as large and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "UPLOAD", "QUERY", "API", "PRESIGNED URL", "S3", "DYNAMODB", "KEYED READ", "FULL SCAN". No other text or numerals beyond the labels listed above and the blue numerals 1 to 3, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): The API issues the signed pass; file bytes follow the separate elevated rail directly into S3, never through API. DynamoDB KEYED READ and FULL SCAN are parallel alternatives, not sequential. No cross-divider connections.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Preserve right QUERY half exactly. Fix only left UPLOAD half: add a small browser window above-left of API, label it BROWSER exactly once. The elevated file-byte blue arrow must start at BROWSER and end at S3, never touch API. Keep lower API and PRESIGNED URL pass, but connect the pass back toward BROWSER with a thin return arrow; remove the lower PRESIGNED URL -> S3 arrow. Three numbered stages: 1 browser-to-API request, 2 beside returned pass, 3 on direct browser-to-S3 file arrow. Exactly numerals 1,2,3 once each. All existing labels preserved, plus BROWSER, no others. S3 remains vault hero. This illustrates signed direct upload, not API proxying file bytes.
```

### Chỉnh sửa

```text
One localized change ONLY: connect the currently dangling blue request line marked 1 to the bottom of the BROWSER window, extending it down then right into API. Direction must be BROWSER -> API. Keep all other labels, number badges, paths, objects and entire right half unchanged.
```


## L06 — SQS, worker, DLQ và cách biết hệ thống đang chết dần

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how an SQS queue with visibility timeout, workers and a dead-letter bin reveals a system dying slowly, read strictly left to right. Three labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a conveyor belt carrying paper envelopes, (2) one envelope under a lowered translucent glass dome with a small worker arm working on it, (3) a row of three robot arms, each with one timer hovering above it at a different reading. Large blue numerals 1 to 3 sit on the rail between the objects. The conveyor belt is the hero, drawn three times larger and brighter. Two further labelled objects sit on short unnumbered spurs: a rack of thick pipes beside the robot arms with the last pipe running dry, and at the far end a dark bin fed by a red side chute with curled ends. Envelopes pile up behind the dome. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "SQS", "VISIBILITY TIMEOUT", "WORKERS", "CONNECTION POOL", "DLQ". No other text or numerals beyond the labels listed above and the blue numerals 1 to 3, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): CONNECTION POOL is only a side resource used by WORKERS; DLQ is a separate redrive branch from the queue after repeated failures. Never connect pool to DLQ. Visibility timeout is a temporary cover over an in-flight queue message, not an additional service.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Preserve all five objects and labels. DELETE the entire BLUE arrow and numeral 3 between WORKERS and DLQ, leaving empty plate. Instead draw one thin RED branch from the SQS conveyor along the front empty margin, arrow ending in DLQ bin. Add a small circular red retry arrow on this branch before bin. This is queue redrive after repeated failures. Set numeral 1 beside SQS, 2 beside covered in-flight message, 3 beside WORKERS; each once. CONNECTION POOL stays separate, connected only to workers. No worker-success-to-DLQ connection.
```

### Chỉnh sửa

```text
One localized change ONLY: restore the BLUE horizontal message-flow connection from the RIGHT edge of SQS conveyor to LEFT edge of the VISIBILITY TIMEOUT dome, and a second BLUE rightward arrow from RIGHT edge of the dome to LEFT edge of WORKERS platform. Route at mid-height behind the three labels; do not cover text or number badges. Do NOT add any connection to DLQ. Keep existing red SQS-to-DLQ retry branch completely unchanged, preserve all five labels and numbers1,2,3.
```


## L07 — Vòng đời một request trong FastAPI: từ khoá def quyết định số phận event loop

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: why one blocking call inside async def freezes the whole event loop while a def handler runs safely in a thread pool, shown as two separate rails that never touch. Upper rail: a large ring carrying small carts around its rim, with one handler cube riding the rim; one cart on the ring is wedged and glowing red, and a red pulse spreads backward through the carts jammed behind it. Lower rail: a straight side lane running parallel below the ring, its carts rolling freely and never stalling. The two rails stay apart; no rail joins the ring to the lane. Large blue numerals 1 and 2 sit on the upper rail and numerals 1 and 2 on the lower rail, numbered per rail. The ring is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "EVENT LOOP", "THREAD POOL", "HANDLER", "BLOCKED". No other text or numerals beyond the labels listed above and the blue numerals 1 to 2 per rail, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Use a compact technical circular scheduler schematic for EVENT LOOP, not a carnival or scenic ring. HANDLER is a cube on that loop. BLOCKED marks the blocking cube and backed-up tasks. THREAD POOL is a distinct independent healthy lane below.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L08 — Dependency injection cho auth và DB session: connection pool bị biến thành hàng đợi

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how holding one pooled connection across an await turns a connection pool into a queue, read strictly left to right. Four labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a small valve, (2) a large rack of thick cable sockets where every socket is occupied, (3) a closed metal shutter with a red indicator lamp standing immediately behind the rack, (4) a database cylinder. Large blue numerals 1 to 4 sit on the rail between the objects. The socket rack is the hero, drawn twice as large and brighter. One cable stays plugged in with a slack loop going nowhere, clearly idle; a line of small waiting figures with cables piles up behind a blocked socket; the closed shutter glows red. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "YIELD", "CONNECTION POOL", "POOL EXHAUSTED", "POSTGRESQL", "SESSION", "QUEUE". No other text or numerals beyond the labels listed above and the blue numerals 1 to 4, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): YIELD represents scoped session acquisition/cleanup, not a network service. Label SESSION at the held idle cable and QUEUE at waiting connection requests. CONNECTION POOL -> POSTGRESQL is the actual resource route; POOL EXHAUSTED is the red state marker over its blocked outlet, not a separate service.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L09 — Backend Python gọi AWS: credential, timeout, retry và idempotency

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how a Python backend calls AWS safely with a credential chain, explicit timeout, retry and an idempotency key, read strictly left to right. Five labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a blocky server-shaped plinth, (2) a vertical rack of three keys in a chain with only the topmost key glowing green, (3) a round dial with two concentric gauge rings, each ring carrying its own separate needle, (4) a second round dial beside it, (5) a parcel with a large key inserted into its lock. Large blue numerals 1 to 5 sit on the rail between the objects. The vertical key rack is the hero, drawn twice as large and brighter. The inserted key glows green. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "FASTAPI", "CREDENTIAL CHAIN", "TIMEOUT", "RETRY", "IDEMPOTENCY KEY". No other text or numerals beyond the labels listed above and the blue numerals 1 to 5, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Present the five objects as a left-to-right SDK call checklist, not five external network services. TIMEOUT must clearly have two needles; only one key in CREDENTIAL CHAIN is active. Use original five labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Only fix number badges: make exactly five blue circular badges labelled 1,2,3,4,5 from left to right, one beside each respective object FASTAPI, CREDENTIAL CHAIN, TIMEOUT, RETRY, IDEMPOTENCY KEY. Existing image is missing 3. Keep every object, label, color and layout otherwise unchanged.
```

### Chỉnh sửa

```text
ONLY ADD one small blue circular number badge with white digit 4, in empty space directly below the RETRY label, centered at x=1037 y=666. Do not move, remove, replace or change any other numbers or elements. Keep 1,2,3,5 as they are. Exactly one NEW 4 badge.
```


## L10 — Lambda hay container/ECS: chọn theo vòng đời công việc, không theo mức độ hiện đại

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: choosing between Lambda and a container by workload lifetime, not by how modern it is, shown as a side-by-side comparison. A thin dashed vertical divider splits the base plate; the left half carries the label "SHORT JOBS" and the right half the label "LONG RUNNING". Left half: a dense burst of many tiny glowing cubes, each appearing and vanishing in mid-air, with a small coin meter ticking beside them and short-lived spark trails. Right half: one large container box running continuously with a steady warm glow, and a long horizontal bar beside it filled almost to the end. The large container box is the hero, drawn twice as large and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "LAMBDA", "METER", "CONTAINER/ECS", "UPTIME", "SHORT JOBS", "LONG RUNNING". No other text, no other numbers, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Maintain two independent comparison halves with no connecting data rail. No extra typography.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Remove the gold lambda logo from front of LAMBDA cube, leave blank matte navy face with blue edge. All labels and other objects remain unchanged. No logos.
```


## L11 — Đo lường và sự cố: log, metric, alarm, transaction và một dòng UPDATE thua cuộc

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how observability stays silent while a losing update oversells the stock, read strictly left to right. Six labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a vertical stack of three translucent log panels threaded through by one glowing thread, (2) a chart board carrying one flat horizontal line, (3) a second chart board carrying one flat horizontal line, (4) a small dark bell with no clapper, (5) a tally board with two columns and a visible gap between the two counts, (6) a shelf holding one single item with two hands reaching for that same item at the same moment, each holding an identical card. Large blue numerals 1 to 6 sit on the rail between the objects. The two hands at the shelf are the hero, drawn twice as large and brighter: one card is placed and stays glowing green, the other slides off the shelf edge and falls away glowing red. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "CORRELATION ID", "5XX", "P99", "ALARM", "INVARIANT", "UPDATE". No other text or numerals beyond the labels listed above and the blue numerals 1 to 6, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Important correctness: these are parallel OBSERVABILITY signals and a business invariant/update problem, not a network call chain. Keep the original six objects and labels but use a thin grey reading guide instead of a blue call rail between metrics. Highlight silent ALARM and red losing UPDATE; failed update must not appear to succeed. No other labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Fix reading-order badges only: exactly 1 beside CORRELATION ID, 2 beside 5XX, 3 beside P99, 4 beside ALARM, 5 beside INVARIANT, 6 beside UPDATE. All six numbers exactly once, small clean blue circles above each label. Keep grey reading guide, objects, six labels and visual content unchanged. The alarm remains dark.
```


## L12 — Reactivity: ref, reactive và cái Proxy

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how Vue tracks a read and reruns on a write through two independent wrappers, read strictly left to right. Five labelled objects sit on a clean base plate: (1) a small sealed box holding one glowing dot on a short left spur, (2) a tight cluster of interconnected nodes wrapped in a thin translucent shell on a second short left spur at the same height, with no rail between the two spurs, both spurs joining at (3) a turnstile logging each pass through the centre, (4) a small bell on its own post beside the turnstile joined to the cluster by a separate short wire, (5) a single detached node on a broken red side spur whose wire is cut with curled ends, gone dark and glowing red. Large blue numerals 1 to 5 sit beside the objects in lesson order. The node cluster is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "REF", "REACTIVE", "TRACK", "TRIGGER", "LOST REACTIVITY". No other text or numerals beyond the labels listed above and the blue numerals 1 to 5, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): REF and REACTIVE are independent reactive wrappers. Grey associations from both to TRACK and to TRIGGER; do not show ref converting into reactive. LOST REACTIVITY is a detached primitive snapshot with visibly broken connection. No extra labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Keep all five labelled objects, palette and plate. Replace the blue sequential TRACK -> TRIGGER wire with EMPTY SPACE. Both REF and REACTIVE must each have a thin grey independent association to TRACK and a second thin grey association to TRIGGER; these are read and write mechanisms, not a call chain. LOST REACTIVITY must be a short broken red branch from REACTIVE itself, not from TRIGGER. Keep blue number badges 1,2,3,4,5 by corresponding objects. Do not duplicate any label.
```


## L13 — computed, watch và watchEffect: dependency, caching, side effect

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how a cached derivation differs from declared side effects, shown as two clearly separated branches on one clean base plate with no rail joining them. Left branch: (1) a dial wired to (2) a latched cabinet with a mechanical latch holding one glowing card inside. Right branch: (3) a clock tower beside (4) three small clocks at three different heights with hands stopped at different positions, feeding (5) a narrow slot with two lanes where a bright newer arrow arrives first and a dim dustier older arrow lands on top of it. Large blue numerals 1 to 5 sit beside the objects in lesson order. The latched cabinet and the narrow two-lane slot are drawn at equal emphasis, neither larger than the other. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "COMPUTED", "CACHE", "WATCH", "FLUSH", "STALE RESPONSE". No other text or numerals beyond the labels listed above and the blue numerals 1 to 5, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Two separated examples: COMPUTED -> CACHE left; WATCH -> FLUSH -> STALE RESPONSE right. Show older response overwriting newer as the red failure. No connecting rail between halves.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Only fix number badges and separation. Place exactly one blue badge 1 by COMPUTED, 2 by CACHE, 3 by WATCH, 4 by FLUSH, 5 by STALE RESPONSE. Existing 2 is missing. Keep two independent branches with NO connecting line between CACHE and WATCH. Preserve objects and all five labels.
```

### Chỉnh sửa

```text
ONLY ADD two small blue circular number badges in EMPTY space BELOW the labels: white digit 2 centered below CACHE at x=500 y=650, and white digit 4 centered below FLUSH at x=1100 y=650. Do not change or delete existing 1,3,5 or any object, label or wire. Exactly two new badges.
```


## L14 — Component: SFC, script setup, props và emits

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how one component file compiles and exchanges data through one-way flows and stable keys, read strictly left to right. Five labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a stamping press pressing a flat blank sheet down into a finished component tile, with a small neat pile of identical output tiles beside it, (2) a short pipe pointing down into the tile with a valve that opens only inward, (3) a second pipe pointing up out of the tile with a valve that opens only outward, (4) a straight rail with list items threaded onto it in order, (5) one item on that rail with a loose crooked peg, its contents swapped with its neighbour, glowing red. Large blue numerals 1 to 5 sit on the rail between the objects. The stamping press is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "SFC", "PROPS", "EMITS", "KEY", "KEY MISMATCH". No other text or numerals beyond the labels listed above and the blue numerals 1 to 5, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): PROPS and EMITS are opposing parent/component flows, not sequential function calls. SFC hero is central-left with incoming downward PROPS and outgoing upward EMITS. KEY is a separate stable-identity list comparison at right; KEY MISMATCH is red bad-state marker on a misbound list item. Avoid a rail connecting PROPS to EMITS to KEY.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Correct the diagram structure, preserving style and all five labelled objects. REMOVE horizontal rail linking all objects. SFC large press at left-center: PROPS pipe above SFC directs DOWN into the component tile, EMITS pipe alongside directs UP out of that same tile. These are opposing one-way flows to/from the component, not serial services. Right side isolated list items KEY and red malformed list item KEY MISMATCH. No line from component pipes to key examples. Place small blue number badges 1 SFC,2 PROPS,3 EMITS,4 KEY,5 KEY MISMATCH, each once. Large labels directly below respective objects, no logo or extra text.
```


## L15 — Composable, provide/inject và Pinia: tách logic hay chia sẻ trạng thái

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how isolated logic differs from shared state, shown as three clearly separated columns on one clean base plate. Left column: three identical small workbenches side by side, each holding its own sealed jar of glowing liquid, with absolutely no pipes between the jars. Middle column: an open hatch in a ceiling plate with a vertical shaft descending from it and feeding a small subtree of rooms below. Right column: one large central reservoir with pipes radiating out to many small stations scattered around it. No rail joins the three columns; each column stands isolated on the bare base plate. The central reservoir is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "COMPOSABLE", "PROVIDE/INJECT", "PINIA STORE". No other text, no other numbers, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Three separate columns, absolutely no rails linking columns. The separate COMPOSABLE instances each have their own local state, PROVIDE/INJECT passes scoped state down a subtree, PINIA STORE shares one state across clients.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L16 — Vue Router: route params, navigation guard và lazy loading

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how reusing one component across param changes, a guard redirect and lazy loading interact, read strictly left to right. Four labelled objects sit on a clean base plate. Three sit in order on one glowing blue rail: (1) a carriage on the track whose small roof sign has flipped to a new face while the carriage body is completely unchanged, (2) a guard booth with a barrier arm lowered over a waiting train, (3) a crate beside the track being lifted and loaded. Large blue numerals 1 to 3 sit on that rail. The fourth object sits on a short detached side spur with no rail joining it: a heavy backend door with a combination dial set into a solid wall, with no key anywhere near the guard booth. The carriage is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "ROUTE PARAM", "NAV GUARD", "LAZY CHUNK", "BACKEND AUTHZ". No other text or numerals beyond the labels listed above and the blue numerals 1 to 3, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): NAV GUARD is client navigation convenience; separate BACKEND AUTHZ is actual independent server enforcement. Do not draw a security-authority link from guard to backend. Keep all four labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L17 — Form, trạng thái và chuyển kiến thức từ React sang Vue

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how form state, a locked submit and a reused idempotency key work together, read strictly left to right. Six labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a control console with a cluster of small gauges, (2) one large round submit button physically clamped down in the pressed position, with a cluster of impatient fingers hovering above it unable to press again, (3) a dock loading crates, (4) two different crates stamped with the exact same round seal, (5) a ledger desk where a clerk files both crates under a single entry, (6) the second crate standing open to reveal a manifest that belongs to the first crate, glowing red. Large blue numerals 1 to 6 sit on the rail between the objects. The clamped submit button is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "FORM", "SUBMITTING", "CLIENT", "IDEMPOTENCY KEY", "SERVER", "WRONG RESULT". No other text or numerals beyond the labels listed above and the blue numerals 1 to 6, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): This illustrates the BUG of reusing one idempotency key for DIFFERENT payloads: two crates visibly differ but carry identical seals. SERVER returns the first result for the second request, WRONG RESULT red. SUBMITTING prevents repeated presses only while pending. No extra labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Only correct number badges to full sequence: 1 FORM, 2 SUBMITTING, 3 CLIENT, 4 IDEMPOTENCY KEY, 5 SERVER, 6 WRONG RESULT. Existing 3 is missing. Put one small blue numbered circle beside each object above its label, exactly once each. Preserve all objects and all six labels; preserve contrasting blue/orange crates and identical seals.
```


## L18 — Hợp đồng API giữa Vue và FastAPI

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how a frontend and a backend meet through one exact contract, read strictly left to right. Four labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a tower carrying a socket, (2) a facing tower carrying a plug, (3) a clamp joint locking the plug into the socket between the two towers, (4) a crisp, neatly folded rectangular envelope. Large blue numerals 1 to 4 sit on the rail between the objects. The clamp joint is the hero, drawn three times larger and brighter. On short unnumbered spurs: a large blueprint sheet unrolling across the base beside the joint, and a crumpled torn envelope lying on a broken red spur with curled ends. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "VUE", "FASTAPI", "API CONTRACT", "VALID PAYLOAD", "INVALID PAYLOAD", "OPENAPI SCHEMA". No other text or numerals beyond the labels listed above and the blue numerals 1 to 4, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Fix the call topology while retaining all six objects: VUE on left -> central oversized API CONTRACT clamp -> FASTAPI on right. VALID PAYLOAD envelope travels through the clamp; INVALID PAYLOAD branches downward red and stops at validation; OPENAPI SCHEMA above has a thin grey association to the contract. No false Vue -> FastAPI -> Contract -> payload sequence.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Remove the green Vue brand logo from browser and replace it with abstract blue UI bars, no letters. Move VALID PAYLOAD envelope from far right onto the blue connection between API CONTRACT and FASTAPI, visually going toward FASTAPI. Main path VUE -> API CONTRACT -> VALID PAYLOAD -> FASTAPI. Number badges exactly 1 by Vue,2 by contract,3 by valid payload,4 by FastAPI. OPENAPI SCHEMA remains grey-associated above contract and INVALID PAYLOAD remains red rejected branch below contract. All six labels preserved once.
```


## L19 — Auth xuyên hai phía: token, nơi lưu, interceptor, và ai quyết định quyền

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how one interceptor carries a token to a single backend authority, with the two token kinds and the two storage choices shown as parallel branches, read strictly left to right. Six labelled objects sit on a clean base plate. Two sit on the main rail, joined by one glowing blue rail: (1) a turnstile fitted with a scanning arm, (2) a tall shield wall. Large blue numerals 1 and 2 sit on the rail between them. The other four sit on two unnumbered branches that leave the turnstile and never join the main rail: the upper branch holds a short glowing pass with a small bar draining fast beside it, and a long card with a much larger bar draining slowly; the lower branch holds a sealed opaque box with a heavy padlock, and an open glass jar whose contents are plainly visible, glowing red. The shield wall is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "INTERCEPTOR", "BACKEND AUTHORITY", "ACCESS TOKEN", "REFRESH TOKEN", "HTTPONLY COOKIE", "LOCALSTORAGE". No other text or numerals beyond the labels listed above and the blue numerals 1 to 2, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): ACCESS TOKEN and REFRESH TOKEN are two parallel distinct cards, not one sequential chain. HTTPONLY COOKIE and LOCALSTORAGE are two ALTERNATIVE storage choices, not connected to each other. Thin grey association lines for choices; only blue request rail INTERCEPTOR -> BACKEND AUTHORITY. Cookie indicates JS inaccessible, not absolute security. No extra labels.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L20 — Upload file: từ ô chọn file tới S3

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how file bytes go straight from the browser to storage on a permission the API signs first, read left to right. Five labelled objects sit on a clean base plate. Four sit in order on the main glowing blue rail: (1) a browser window, (2) a small block building, (3) a glowing signed pass held high beside the building, (4) a large vault. Large blue numerals 1 to 4 sit on the main rail between the objects. A separate elevated bridge arcs from the browser high over the building and drops straight into the vault, carrying one file icon, while the building below stays shut with its doors closed and its windows dark. A thin unnumbered grey spur runs from the building into (5) a database cylinder, carrying one small flat card. The vault is the hero, drawn three times larger and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "BROWSER", "API", "PRESIGNED URL", "S3 VAULT", "POSTGRESQL". No other text or numerals beyond the labels listed above and the blue numerals 1 to 4, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Correct topology overrides the original four-object sequential rail: BROWSER -> API is signing request, API returns PRESIGNED URL pass to BROWSER along a small return rail. Separate dominant elevated blue file-bytes rail BROWSER -> S3 VAULT entirely bypasses API. Grey metadata-only spur API -> POSTGRESQL. No API -> presigned URL -> S3 file flow. Use only stage numerals 1,2,3 by request, return pass, direct upload.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Keep BROWSER, API, POSTGRESQL and direct top browser-to-S3 arrow. Change S3 VAULT into a large physical vault with circular secure door, about twice the API size. Move PRESIGNED URL card onto the RETURN arrow from API back to BROWSER; arrowhead must point toward browser. Remove current erroneous PRESIGNED URL -> API arrow. Make top direct file arrow carry one small file icon. Numerals 1 on browser-to-API,2 on returned signed pass,3 on direct upload. Preserve all five labels once, no others.
```


## L21 — Đẩy việc nặng sang SQS và worker

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how an SQS message leaves only after the database transaction has committed, read strictly left to right. Three labelled objects sit in one row on a clean base plate, joined by a single glowing blue rail: (1) a large transparent box, its lid sealed shut, enclosing a database cylinder and one extra small row beside it, (2) a paper envelope lifted out of that extra row by a sweeper arm only after the lid seals, (3) a conveyor carrying that envelope through a series of small stations, each with its own hovering timer, past a robot arm. Large blue numerals 1 to 3 sit on the rail between the objects. The sealed transparent box is the hero, drawn three times larger and brighter. At the end, an unnumbered red side chute tips the envelope into a dark bin. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "POSTGRESQL TRANSACTION", "SQS MESSAGE", "WORKER", "DLQ". No other text or numerals beyond the labels listed above and the blue numerals 1 to 3, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Sealed POSTGRESQL TRANSACTION contains both business row and outbox row. Relay lifts an envelope only after commit into SQS MESSAGE queue; WORKER consumes; red failed-message branch from queue to DLQ after retries. No successful message goes to DLQ.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Preserve all four labels and objects. The transparent POSTGRESQL TRANSACTION box MUST be completely CLOSED AND SEALED, lid flush on top, closed lock, not open or tilted; still show database and two record cards through glass. Remove red branch from WORKER to DLQ; instead red branch originates at SQS MESSAGE queue and routes along front margin to DLQ with small retry-loop icon. Blue route ends after WORKER successfully; DLQ is a separate failed-message branch. Numerals exactly 1 at transaction,2 at queue,3 at worker. No new text.
```


## L22 — Một tính năng end-to-end: từ ô nhập tới hàng trong DB, kèm ba chỗ hỏng

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: one end-to-end chain from the input box to the database row with three marked failure joints, read strictly left to right. Six labelled objects sit in one row on a clean base plate, joined by a single continuous glowing blue rail: (1) a browser window with an input box, (2) a small block building, (3) a database cylinder, (4) a large vault fed by a raised bridge segment of the same rail arcing over the building, (5) a conveyor belt, (6) a robot arm. Large blue numerals 1 to 6 sit on the rail between the objects. Exactly three joints carry a pulsing red beacon lamp: between (1) and (2) for a double press, between (3) and (4) for a lost confirmation leaving an orphan pending row, and between (5) and (6) for a worker dying before acknowledgement. The database cylinder is the hero, drawn twice as large and brighter. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "BROWSER", "API", "POSTGRESQL", "S3", "SQS", "WORKER", "DOUBLE PRESS", "ORPHAN PENDING", "WORKER DEATH". No other text or numerals beyond the labels listed above and the blue numerals 1 to 6, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Topology accuracy overrides the single sequential blue rail. Retain six main objects and three failure labels: BROWSER -> API -> POSTGRESQL is metadata route. A separate elevated blue file rail connects BROWSER directly to S3, bypassing API and database. API -> SQS -> WORKER is background task route after confirmation/commit. No POSTGRESQL -> S3 or S3 -> SQS arrow. Red DOUBLE PRESS at browser/API, ORPHAN PENDING at dashed confirmation association between S3 and API/DB state, WORKER DEATH at queue/worker. Number only main metadata route 1,2,3; branches unnumbered.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```


## L23 — DDoS: tấn công bị hấp thụ ở biên, người dùng thật đi qua

```text
Isometric technical schematic illustration, orthographic camera with no perspective distortion, everything in focus (no depth of field, no bokeh, no blur). A single clean matte base plate floating on a plain neutral gradient background, and absolutely nothing else in the environment: no rocks, no plants, no terrain, no scenery, no clouds, no decorative props beyond the labelled objects. Objects are simple matte shapes with thin dark outlines, brushed-metal and matte-plastic surfaces, soft even studio lighting, crisp high-contrast edges. Strict colour legend, used semantically and consistently: vivid blue #1b5fb8 for the data-flow rail and numbers; signal green #1d6b3f for success, allowed, healthy; warning amber #b45309 for throttled, at-limit, warning; error red #b91c1c for failure, denied, error; deep slate navy #1b2735 for structure and housing; steel grey #64748b for neutral hardware; off-white #f7f8fa for the background. Short English labels in clean bold sans-serif capital letters, placed directly on or below the objects they name. Flat diagram aesthetic, high legibility, uncluttered, generous empty space between objects. The base plate fills most of the frame, leaving only a small even margin of background around it. No Vietnamese text, no long sentences, no logos, no watermark, no decorative clutter. Landscape 3:2.

Scene: how a flood of junk traffic dies at a layered edge while one real user reaches capped compute, read left to right. Six labelled objects sit on a clean base plate: (1) a dense cluster of many small identical grey devices on the far left, (2) a single clean user device below them, (3) a tall wide wall in the middle as the hero, drawn three times larger and brighter, built from a broad lower band and a narrower upper band, (4) a small checkpoint gate directly behind the wall, (5) a compute box far right on the upper branch, (6) a database cylinder far right on the lower branch, each with a dashed amber ceiling bar above it. A thick red beam leaves the cluster, strikes the hero wall and stops there, its end crumpled with a small red pulse; no red passes the wall. One thin blue rail leaves the user device, threads a narrow gap through the wall and gate, then forks to the compute box and database cylinder, carrying blue numerals 1 at the gap and 2 at the fork. Everything else is empty neutral space.

Labels: render each of these exactly once, horizontal, bold sans-serif capitals, directly below its object: "BOTNET", "USER", "EDGE", "WAF LIMIT", "LAMBDA", "DATABASE". Render "DROPPED" in red directly beside the crumpled end of the red beam, "ALLOWED" in green directly on the blue rail, and "CAPPED" once in amber directly above the dashed ceiling bars. No other text or numerals beyond the labels listed above and the blue numerals 1 to 2, no logos, no watermark.

Lesson alignment and technical corrections (take precedence over conflicting scene details): Critical correction: legitimate traffic follows USER -> EDGE -> WAF LIMIT -> LAMBDA -> DATABASE. Do NOT fork the WAF rail directly to DATABASE; database is reachable through Lambda only. Both Lambda and database have amber resource ceilings. Red botnet traffic stops at edge/WAF. This is a conceptual layered defense example, not a guarantee all attacks are always blocked. Keep all nine labels exactly.

Production direction: one polished educational illustration, landscape 1536x1024, opaque PNG. Maximize clarity at normal web lesson width. Large sharply readable labels, ample padding, no overlapping labels or rails, no tiny text. A coherent premium technical textbook plate; subtle dimensionality, matte navy hardware, blue route, restrained shadows. No extra title, legend, label, decorative objects, or typography.
```

### Chỉnh sửa

```text
Only remove the SECOND duplicate CAPPED word located immediately above the DATABASE cylinder. Keep its dashed amber ceiling bar. Keep the first CAPPED word above LAMBDA. Everything else unchanged: exactly one CAPPED in entire image; nine unique labels total.
```

### Chỉnh sửa

```text
Only remove the SECOND duplicate CAPPED word located immediately above the DATABASE cylinder. Keep its dashed amber ceiling bar. Keep the first CAPPED word above LAMBDA. Everything else unchanged: exactly one CAPPED in entire image; nine unique labels total.
```


