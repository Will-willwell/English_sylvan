export type Section = {
  id: string;
  title: string;
  chinese: string;
  units: Unit[];
};

export type Unit = {
  id: number;
  title: string;
  chinese: string;
  section: string;
  page: number;
  description: string;
  tags: string[];
  progress: number;
  status: "in-progress" | "locked" | "ready";
};

export type Expression = {
  english: string;
  chinese: string;
  note: string;
};

export type DialogueMessage = {
  role: "coach" | "user";
  name: string;
  text: string;
};

export type LessonContent = {
  focus: string;
  expressions: Expression[];
  exercise: {
    type: "speak" | "choose" | "rewrite";
    prompt: string;
    options?: string[];
    answer?: string;
    explanation: string;
  };
  dialogue: {
    scenario: string;
    hint: string;
    messages: DialogueMessage[];
  };
};

export const sections: Section[] = [
  {
    id: "networking",
    title: "Networking",
    chinese: "建立联系",
    units: [
      { id: 1, title: "Starting a conversation", chinese: "开启对话", section: "Networking", page: 4, description: "在会议、培训和商务社交场合自然开启一段对话。", tags: ["small talk", "introductions"], progress: 62, status: "in-progress" },
      { id: 2, title: "Talking about jobs", chinese: "谈论工作", section: "Networking", page: 8, description: "清楚、自然地介绍自己的工作与职责。", tags: ["roles", "responsibilities"], progress: 0, status: "ready" },
      { id: 3, title: "Showing interest in other people", chinese: "乐于交往", section: "Networking", page: 12, description: "用追问和积极回应让对话继续下去。", tags: ["follow-up", "rapport"], progress: 0, status: "ready" },
      { id: 4, title: "Exchanging information", chinese: "交换信息", section: "Networking", page: 16, description: "交换联系方式和关键信息。", tags: ["contact details", "clarity"], progress: 0, status: "ready" },
    ],
  },
  {
    id: "telephoning",
    title: "Telephoning",
    chinese: "电话",
    units: [
      { id: 5, title: "Cold calling", chinese: "陌生电话", section: "Telephoning", page: 20, description: "在陌生电话中快速建立信任并说明来意。", tags: ["opening", "sales"], progress: 0, status: "ready" },
      { id: 6, title: "Confirming or rearranging appointments", chinese: "确认或重新安排约见", section: "Telephoning", page: 24, description: "确认时间、改约并清楚复述安排。", tags: ["appointments", "dates"], progress: 0, status: "ready" },
      { id: 7, title: "Making a complaint on the telephone", chinese: "进行电话投诉", section: "Telephoning", page: 28, description: "有礼貌地表达问题、影响与期望结果。", tags: ["complaints", "tone"], progress: 0, status: "ready" },
      { id: 8, title: "Dealing with a complaint on the telephone", chinese: "处理电话投诉", section: "Telephoning", page: 32, description: "安抚对方、确认事实并提出解决方案。", tags: ["service", "solutions"], progress: 0, status: "ready" },
    ],
  },
  {
    id: "meetings",
    title: "Meetings",
    chinese: "会议",
    units: [
      { id: 9, title: "Running a face-to-face meeting", chinese: "安排面对面的会议", section: "Meetings", page: 36, description: "开场、控制流程并让每个人参与。", tags: ["agenda", "facilitation"], progress: 0, status: "ready" },
      { id: 10, title: "Negotiating agreement", chinese: "磋商协议", section: "Meetings", page: 40, description: "提出条件、回应异议并达成共识。", tags: ["negotiation", "agreement"], progress: 0, status: "ready" },
      { id: 11, title: "Assigning action points", chinese: "分配行动计划", section: "Meetings", page: 44, description: "明确负责人、截止时间与下一步行动。", tags: ["actions", "deadlines"], progress: 0, status: "ready" },
      { id: 12, title: "Running a teleconference", chinese: "安排电话会议", section: "Meetings", page: 48, description: "在远程会议中确认连接、轮流发言和总结。", tags: ["remote", "summaries"], progress: 0, status: "ready" },
    ],
  },
  {
    id: "presentations",
    title: "Presentations & conferences",
    chinese: "陈述与会议",
    units: [
      { id: 13, title: "Presenting a product or service", chinese: "介绍产品或服务", section: "Presentations", page: 52, description: "围绕客户价值清楚介绍产品或服务。", tags: ["value", "pitch"], progress: 0, status: "ready" },
      { id: 14, title: "Working on a stand", chinese: "展位工作", section: "Presentations", page: 56, description: "在展会展位上接待访客并筛选需求。", tags: ["events", "leads"], progress: 0, status: "ready" },
      { id: 15, title: "Closing a sale", chinese: "结束交易", section: "Presentations", page: 60, description: "确认购买意向、下一步和交付细节。", tags: ["closing", "next steps"], progress: 0, status: "ready" },
      { id: 16, title: "Saying 'no' politely", chinese: "礼貌拒绝", section: "Presentations", page: 64, description: "坚定但不失礼貌地拒绝请求或条件。", tags: ["boundaries", "diplomacy"], progress: 0, status: "ready" },
    ],
  },
  {
    id: "interviews",
    title: "Interviews",
    chinese: "面试",
    units: [
      { id: 17, title: "The successful job interviewer", chinese: "成功的面试官", section: "Interviews", page: 68, description: "用结构化问题和追问进行有效面试。", tags: ["questions", "selection"], progress: 0, status: "ready" },
      { id: 18, title: "The successful interview candidate", chinese: "成功的求职者", section: "Interviews", page: 72, description: "用具体例子清晰回答面试问题。", tags: ["answers", "examples"], progress: 0, status: "ready" },
      { id: 19, title: "Carrying out performance reviews", chinese: "执行绩效评估", section: "Interviews", page: 76, description: "谈论成果、反馈与成长目标。", tags: ["feedback", "goals"], progress: 0, status: "ready" },
      { id: 20, title: "Persuading your manager", chinese: "说服你的经理", section: "Interviews", page: 80, description: "用事实、影响和方案说服管理者。", tags: ["influence", "evidence"], progress: 0, status: "ready" },
    ],
  },
];

const e = (english: string, chinese: string, note: string): Expression => ({ english, chinese, note });
const d = (role: "coach" | "user", name: string, text: string): DialogueMessage => ({ role, name, text });

export const lessonContent: Record<number, LessonContent> = {
  1: {
    focus: "用普通但有热情的话题开始，匹配对方情绪，并用一个追问把对话继续下去。",
    expressions: [
      e("So, what do you do exactly?", "那么，你具体是做什么工作的？", "自然追问对方职责；exactly 放在句末时语气更友好。"),
      e("Where do you come from then?", "那么，你来自哪里？", "在 small talk 中自然转向地点和背景。"),
      e("How did you get here?", "你是怎么到这里的？", "did you 在自然语速中可以连读。"),
      e("Have you been here before?", "你以前来过这里吗？", "现在完成时用于询问到目前为止的经历。"),
    ],
    exercise: { type: "speak", prompt: "用两句话介绍你的工作，再问对方一个开放式问题。", answer: "I work in product operations. What about you?", explanation: "先给出具体职责，再用 What about you? 把发言权交给对方。" },
    dialogue: { scenario: "你在 Marseille 的商务会议上与一位代表交谈。", hint: "保持 friendly tone；先回应，再提出一个追问。", messages: [d("coach", "Alex", "The last presentation was really interesting, wasn't it?"), d("user", "你", "Yes, it was. So, what do you do exactly?"), d("coach", "Alex", "I'm a forensic auditor. What about you?")] },
  },
  2: {
    focus: "介绍职位时先说领域，再补充职责和工作成果；避免只报一个职位名称。",
    expressions: [
      e("I work in customer success.", "我从事客户成功工作。", "work in 后面接领域或部门。"),
      e("I’m responsible for onboarding new clients.", "我负责新客户入门。", "be responsible for 后接名词或动名词。"),
      e("My main role is to coordinate the project team.", "我的主要工作是协调项目团队。", "用 main role 让介绍更聚焦。"),
      e("What does your role involve?", "你的工作具体包括什么？", "比 What do you do? 更适合继续了解职责。"),
    ],
    exercise: { type: "rewrite", prompt: "把这句话说得更具体：I’m a manager.", answer: "I manage a small operations team and oversee client delivery.", explanation: "职位介绍最好包含管理对象或核心职责。" },
    dialogue: { scenario: "午餐前，你和新认识的同事交换工作信息。", hint: "职位 + 主要职责 + 一个追问。", messages: [d("coach", "Priya", "What do you do?"), d("user", "你", "I work in customer success. I'm responsible for onboarding new clients."), d("coach", "Priya", "That sounds interesting. What does your role involve day to day?")] },
  },
  3: {
    focus: "通过积极回应、复述关键词和追问表现出真实兴趣，而不是机械地换话题。",
    expressions: [
      e("Really? Tell me more about that.", "真的吗？再多说说。", "语调上扬，表达真诚兴趣。"),
      e("That sounds challenging.", "听起来很有挑战。", "对工作难点做简短共情。"),
      e("How did you get into that field?", "你是怎么进入这个领域的？", "get into 表示进入某个行业或领域。"),
      e("What do you enjoy most about it?", "你最喜欢其中哪一点？", "用 enjoy 引出积极、个人化的回答。"),
    ],
    exercise: { type: "choose", prompt: "对方说：I’ve just moved into a new role. 选择最自然的回应。", options: ["Never mind.", "Really? What does the role involve?", "I don’t know."], answer: "Really? What does the role involve?", explanation: "先表达兴趣，再通过具体问题让对方继续说。" },
    dialogue: { scenario: "对方提到刚刚转岗，你要让对话继续。", hint: "先用 Really? 或 That sounds... 表示回应。", messages: [d("coach", "Daniel", "I've just moved into a regional sales role."), d("user", "你", "Really? What does the role involve?"), d("coach", "Daniel", "I look after three markets and travel quite a lot.")] },
  },
  4: {
    focus: "交换联系方式时复述关键信息，必要时拼写并确认下一步。",
    expressions: [
      e("Could I take your contact details?", "我可以记下你的联系方式吗？", "could 比 can 更礼貌。"),
      e("Let me read that back to you.", "我把它复述给你确认一下。", "电话或嘈杂环境中很实用。"),
      e("Would you mind spelling your surname?", "你介意拼一下姓氏吗？", "spelling 用于确认姓名拼写。"),
      e("I’ll send you a quick follow-up email.", "我会给你发一封简短的跟进邮件。", "用具体下一步结束交流。"),
    ],
    exercise: { type: "speak", prompt: "模拟交换邮箱：说出邮箱、拼写姓氏，并确认你会发送邮件。", answer: "Could I take your email address? Would you mind spelling your surname? I’ll follow up tomorrow.", explanation: "信息交换要慢、清楚，并用复述降低听错风险。" },
    dialogue: { scenario: "活动结束后，你想和潜在合作伙伴保持联系。", hint: "请求联系方式后，复述并确认下一步。", messages: [d("coach", "Marta", "It was great speaking with you."), d("user", "你", "Likewise. Could I take your contact details?"), d("coach", "Marta", "Of course. I’ll send you my email now.")] },
  },
  5: {
    focus: "陌生电话开场要快速说明身份、目的和对对方的价值，避免长篇铺垫。",
    expressions: [
      e("I’m calling to ask about...", "我打电话是想询问……", "直接说明目的。"),
      e("Have I caught you at a bad time?", "现在打给你是否不方便？", "尊重对方时间，降低打扰感。"),
      e("Could I take thirty seconds to explain?", "我可以用 30 秒说明一下吗？", "给对方一个低成本的继续倾听理由。"),
      e("Would it be useful to arrange a short call?", "安排一次简短通话会有帮助吗？", "用开放式、低压力的下一步。"),
    ],
    exercise: { type: "rewrite", prompt: "把销售电话开场改得更专业：I want to sell you our software.", answer: "I’m calling because we help teams reduce manual reporting time.", explanation: "先说对客户的价值，再在后面介绍产品。" },
    dialogue: { scenario: "你第一次联系一家潜在客户。", hint: "身份 + 来意 + 是否方便。", messages: [d("coach", "Reception", "Good morning, how can I help?"), d("user", "你", "I’m calling because we help teams reduce manual reporting time. Have I caught you at a bad time?"), d("coach", "Reception", "I have a few minutes. What is this about?")] },
  },
  6: {
    focus: "确认或改约时同时说清日期、时间、时区和会议方式。",
    expressions: [
      e("I’m calling to confirm our appointment.", "我打电话确认我们的约见。", "confirm our appointment 是固定搭配。"),
      e("Would Thursday afternoon work for you?", "周四下午对你合适吗？", "work for you 表示时间是否合适。"),
      e("Could we move it to 3 p.m. instead?", "我们可以改到下午 3 点吗？", "move it to 用于改时间。"),
      e("Just to confirm, that’s 10 a.m. London time.", "确认一下，是伦敦时间上午 10 点。", "用 just to confirm 避免时区误解。"),
    ],
    exercise: { type: "choose", prompt: "对方说 Wednesday is difficult. 选择合适回应。", options: ["No problem. How about Thursday morning?", "You must come.", "It is Wednesday."], answer: "No problem. How about Thursday morning?", explanation: "先接受限制，再给出一个具体替代方案。" },
    dialogue: { scenario: "原定会议与你的出差冲突，你需要礼貌改约。", hint: "说明原因 + 提出替代时间 + 复述确认。", messages: [d("coach", "Client", "Are we still meeting on Wednesday at two?"), d("user", "你", "I’m afraid I’ll be travelling then. Could we move it to Thursday morning instead?"), d("coach", "Client", "Thursday at ten works for me.")] },
  },
  7: {
    focus: "投诉时先说明事实，再说明影响，最后明确你希望对方采取什么行动。",
    expressions: [
      e("I’m calling about a problem with...", "我打电话是要反映……的问题。", "中性、清楚地进入投诉主题。"),
      e("Unfortunately, the order arrived damaged.", "遗憾的是，订单到货时已损坏。", "unfortunately 让语气更专业。"),
      e("This has caused a delay for our team.", "这给我们的团队造成了延误。", "说明问题的业务影响。"),
      e("I’d like this to be resolved as soon as possible.", "我希望尽快解决这个问题。", "表达期望，不使用攻击性语言。"),
    ],
    exercise: { type: "rewrite", prompt: "把 I’m angry about the delivery 改成商务投诉表达。", answer: "I’m calling about a delivery issue that has caused a delay for our team.", explanation: "用事实和影响替代情绪化指责。" },
    dialogue: { scenario: "一批重要设备延迟到货，你致电供应商。", hint: "事实 → 影响 → 期望解决时间。", messages: [d("coach", "Supplier", "How can I help you today?"), d("user", "你", "I’m calling about a delivery issue. The order arrived damaged and this has caused a delay for our team."), d("coach", "Supplier", "I’m sorry to hear that. What would you like us to do?")] },
  },
  8: {
    focus: "处理投诉时先承认问题和影响，再确认事实，最后给出可执行方案。",
    expressions: [
      e("I’m sorry you’ve had this experience.", "很抱歉你遇到了这样的情况。", "先承认对方体验，不急于辩解。"),
      e("Let me check the details for you.", "我来帮你核实细节。", "给出正在处理的信号。"),
      e("Here’s what I can do today.", "今天我可以这样处理。", "用可控范围内的方案回应。"),
      e("I’ll keep you updated by the end of the day.", "我会在今天结束前向你更新进展。", "承诺具体时间点。"),
    ],
    exercise: { type: "speak", prompt: "用三句话回应客户投诉：道歉、方案、更新承诺。", answer: "I’m sorry about the delay. I’ll arrange a replacement today and keep you updated by 5 p.m.", explanation: "好的回应需要让客户知道你理解问题，并且知道下一步何时发生。" },
    dialogue: { scenario: "你是客户服务经理，正在处理延误投诉。", hint: "不要立即归责；给出今天能执行的动作。", messages: [d("coach", "Customer", "We’ve been waiting for this order for two weeks."), d("user", "你", "I’m sorry you’ve had this experience. Let me check the details for you."), d("coach", "Customer", "When can we expect a clear update?")] },
  },
  9: {
    focus: "会议主持人要设定目标、控制时间、邀请不同观点，并在结尾总结决定。",
    expressions: [
      e("Let’s start by agreeing the agenda.", "我们先确认一下议程。", "让参会者知道会议结构。"),
      e("The aim of today’s meeting is to...", "今天会议的目标是……", "清楚界定目标。"),
      e("Could we hear from someone who hasn’t spoken yet?", "可以请还没发言的人分享一下吗？", "鼓励更多人参与。"),
      e("Let’s park that point for now.", "这个问题我们先暂放。", "避免偏题，同时保留议题。"),
    ],
    exercise: { type: "speak", prompt: "用三句话主持会议开场：目标、议程、时间。", answer: "The aim of today’s meeting is to agree the launch plan. Let’s start with the timeline. We have 45 minutes.", explanation: "开场信息越清楚，会议越容易按时结束。" },
    dialogue: { scenario: "你主持一次产品上线计划会议。", hint: "先给目标，再邀请团队确认议程。", messages: [d("coach", "Colleague", "Shall we get started?"), d("user", "你", "Yes. The aim of today’s meeting is to agree the launch plan. Let’s start with the timeline."), d("coach", "Colleague", "That works. We also need to discuss customer support.")] },
  },
  10: {
    focus: "谈判不是只说自己的条件，要先确认共同目标，再提出让步和交换条件。",
    expressions: [
      e("We’re looking for a solution that works for both sides.", "我们希望找到对双方都可行的方案。", "先建立共同目标。"),
      e("Could you be more flexible on the delivery date?", "交付日期方面可以更灵活一些吗？", "礼貌提出可谈空间。"),
      e("If you can do X, we could offer Y.", "如果你们能做到 X，我们可以提供 Y。", "条件交换句型。"),
      e("I think we’re close to an agreement.", "我认为我们接近达成协议了。", "推动谈判进入收尾。"),
    ],
    exercise: { type: "rewrite", prompt: "把 We need a lower price 改成带有交换条件的谈判表达。", answer: "If you can extend the warranty, we could discuss a higher volume commitment.", explanation: "提出条件时说明你愿意提供什么，谈判会更有建设性。" },
    dialogue: { scenario: "你与供应商协商价格和保修期。", hint: "不要只要求降价，加入可交换条件。", messages: [d("coach", "Supplier", "The quoted price reflects the current specification."), d("user", "你", "I understand. If you can extend the warranty, we could discuss a higher volume commitment."), d("coach", "Supplier", "That could be workable. Let’s look at the numbers.")] },
  },
  11: {
    focus: "行动项必须包含负责人、动作、截止时间和记录方式。",
    expressions: [
      e("Who would like to take this forward?", "谁愿意推进这件事？", "邀请负责人，而不是直接命令。"),
      e("Let’s assign that to...", "我们把这项任务分配给……", "明确责任归属。"),
      e("Could you have a first draft by Friday?", "你能在周五前完成初稿吗？", "用 by 明确截止时间。"),
      e("I’ll put that in the action log.", "我会把这项写进任务记录。", "让行动项可追踪。"),
    ],
    exercise: { type: "choose", prompt: "哪一句最完整？", options: ["James will do it.", "James will send the revised proposal to the client by Friday.", "Someone should check."], answer: "James will send the revised proposal to the client by Friday.", explanation: "责任人、动作、对象和期限都要明确。" },
    dialogue: { scenario: "会议结束前，你负责确认团队行动项。", hint: "逐项复述负责人和截止时间。", messages: [d("coach", "Manager", "What are the next steps?"), d("user", "你", "James will send the revised proposal to the client by Friday. I’ll put that in the action log."), d("coach", "Manager", "Good. Who will check the implementation plan?")] },
  },
  12: {
    focus: "电话会议中要确认音频、轮流发言、打断时礼貌插入，并用总结确保共识。",
    expressions: [
      e("Can everyone hear me clearly?", "大家能清楚听到我吗？", "会议开始先确认连接。"),
      e("I’m afraid you’re breaking up.", "你那边的声音断断续续。", "比直接说 I can’t hear you 更自然。"),
      e("May I come in here?", "我可以补充一下吗？", "礼貌请求插话。"),
      e("Let me summarize where we are.", "我来总结一下目前的共识。", "远程会议中尤其需要总结。"),
    ],
    exercise: { type: "speak", prompt: "模拟线上会议发言：确认听见、礼貌插话、总结下一步。", answer: "I can hear you clearly. May I come in here? Let me summarize where we are.", explanation: "语音质量不稳定时，短句和复述比长句更安全。" },
    dialogue: { scenario: "你参加跨时区远程会议，负责最后总结。", hint: "先确认连接，再用总结收束。", messages: [d("coach", "Host", "Can everyone hear me clearly?"), d("user", "你", "Yes, I can hear you clearly. May I come in here?"), d("coach", "Host", "Of course. Please go ahead.")] },
  },
  13: {
    focus: "产品介绍围绕客户问题、解决方案、价值和下一步，而不是只罗列功能。",
    expressions: [
      e("Let me give you a quick overview.", "我先给你一个简要概览。", "适合短演示开场。"),
      e("The main challenge we address is...", "我们解决的主要挑战是……", "从客户问题切入。"),
      e("What this means for your team is...", "这对你们团队意味着……", "把功能转成客户价值。"),
      e("Would you like to see how it works?", "你想看看它是如何工作的吗？", "自然过渡到演示。"),
    ],
    exercise: { type: "rewrite", prompt: "不要只说 Our platform has dashboards，改成客户价值表达。", answer: "Our platform gives your team a clearer view of performance in real time.", explanation: "产品语言要回答客户‘这对我有什么用’。" },
    dialogue: { scenario: "你向潜在客户介绍一款团队协作工具。", hint: "问题 → 方案 → 客户价值。", messages: [d("coach", "Buyer", "What does your platform do?"), d("user", "你", "The main challenge we address is fragmented project information. Our platform gives teams a clearer view in real time."), d("coach", "Buyer", "Could you show us how it works?")] },
  },
  14: {
    focus: "展位交流要先判断访客需求，再决定介绍深度，最后留下明确跟进动作。",
    expressions: [
      e("What brings you to the event today?", "今天是什么让你来到这个活动？", "比直接推销更自然。"),
      e("Are you currently looking for a solution in this area?", "你们目前正在寻找这方面的解决方案吗？", "判断需求阶段。"),
      e("Would it be useful if I showed you a two-minute demo?", "我给你演示两分钟会有帮助吗？", "给出低门槛邀请。"),
      e("Can I follow up with you next week?", "我下周可以跟进你吗？", "把交流转成下一步。"),
    ],
    exercise: { type: "choose", prompt: "展会访客说 I’m just looking around. 最好的回应是？", options: ["You must buy today.", "Of course. What areas are you most interested in?", "Then leave."], answer: "Of course. What areas are you most interested in?", explanation: "尊重访客节奏，同时用开放问题发现需求。" },
    dialogue: { scenario: "你在展会展位接待一位刚到访的客户。", hint: "先发现需求，不要马上进行完整产品演示。", messages: [d("coach", "Visitor", "I’m just looking around at the moment."), d("user", "你", "Of course. What areas are you most interested in?"), d("coach", "Visitor", "We’re trying to improve our reporting process.")] },
  },
  15: {
    focus: "成交收尾要确认需求、处理最后疑问、复述购买内容并明确下一步。",
    expressions: [
      e("Does that meet your requirements?", "这满足你的要求吗？", "确认方案与需求匹配。"),
      e("Is there anything else you’d like to clarify?", "还有什么需要说明的吗？", "主动处理最后疑问。"),
      e("Shall we go ahead with the order?", "我们现在推进订单吗？", "自然提出成交问题。"),
      e("I’ll send the paperwork over today.", "我今天把文件发给你。", "成交后立即确认动作。"),
    ],
    exercise: { type: "speak", prompt: "用一句问题确认客户准备购买，再说出你的下一步。", answer: "Does that meet your requirements? If so, I’ll send the paperwork over today.", explanation: "先获得确认，再承诺具体动作。" },
    dialogue: { scenario: "客户已经认可方案，你需要完成商务收尾。", hint: "确认需求 → 处理疑问 → 提出下一步。", messages: [d("coach", "Buyer", "The package looks right for us."), d("user", "你", "Great. Is there anything else you’d like to clarify?"), d("coach", "Buyer", "No, I think we’re ready to proceed.")] },
  },
  16: {
    focus: "礼貌拒绝不是模糊拖延，要表达限制、给出原因，并在可能时提供替代方案。",
    expressions: [
      e("I’m afraid we can’t commit to that at the moment.", "恐怕我们目前无法承诺这一点。", "坚定但不生硬。"),
      e("That won’t be possible within the current budget.", "在当前预算内无法做到。", "把拒绝落到客观限制。"),
      e("What I can offer is...", "我可以提供的是……", "拒绝后给替代方案。"),
      e("Could we revisit this next quarter?", "我们下个季度再重新讨论可以吗？", "把暂时拒绝变成可跟进事项。"),
    ],
    exercise: { type: "rewrite", prompt: "把 No, that’s impossible 改成专业拒绝。", answer: "I’m afraid that won’t be possible within the current budget. What I can offer is a phased rollout.", explanation: "说明限制，并给出可行替代方案。" },
    dialogue: { scenario: "客户要求你在本周内增加一项额外服务。", hint: "明确限制，但不要让对话中断。", messages: [d("coach", "Client", "Could you add the extra service by Friday?"), d("user", "你", "I’m afraid we can’t commit to that by Friday. What I can offer is a phased rollout next month."), d("coach", "Client", "That may work if we agree the first phase today.")] },
  },
  17: {
    focus: "面试官要用结构化问题获取事实，并用追问让候选人讲出具体行为和结果。",
    expressions: [
      e("Could you talk me through your experience in...?", "你能介绍一下你在……方面的经历吗？", "开放式开场，适合了解背景。"),
      e("What was your specific contribution?", "你具体做出了什么贡献？", "避免候选人只说 we。"),
      e("What would you do differently next time?", "下次你会做出什么不同？", "了解反思和学习能力。"),
      e("Thank you. I’d like to move on to...", "谢谢，我们接下来谈……", "礼貌控制面试节奏。"),
    ],
    exercise: { type: "choose", prompt: "哪个问题最能追问候选人的个人贡献？", options: ["Did you enjoy it?", "What was your specific contribution?", "Was it good?"], answer: "What was your specific contribution?", explanation: "specific contribution 可以把团队成果拆分到个人行为。" },
    dialogue: { scenario: "你面试一位项目经理，正在追问项目经历。", hint: "从背景追问到个人行为和结果。", messages: [d("coach", "Candidate", "We launched the project successfully in six months."), d("user", "你", "What was your specific contribution?"), d("coach", "Candidate", "I redesigned the reporting process and reduced weekly admin time.")] },
  },
  18: {
    focus: "求职回答使用 STAR 结构：情境、任务、行动、结果，并尽量给出数字或可验证结果。",
    expressions: [
      e("The situation was...", "当时的情况是……", "简洁交代背景。"),
      e("My responsibility was to...", "我的职责是……", "明确任务边界。"),
      e("I decided to... because...", "我决定……，因为……", "说明行动和判断依据。"),
      e("As a result, we...", "结果是，我们……", "用结果收束回答。"),
    ],
    exercise: { type: "speak", prompt: "用 STAR 结构回答：Tell me about a time you solved a difficult problem.", answer: "The situation was... My responsibility was... I decided to... As a result, we...", explanation: "先用模板组织逻辑，再替换成你自己的真实经历。" },
    dialogue: { scenario: "你参加项目经理岗位面试，回答解决问题的经历。", hint: "不要只说 I solved it；说清行动和结果。", messages: [d("coach", "Interviewer", "Tell me about a time you solved a difficult problem."), d("user", "你", "The situation was a delayed launch. My responsibility was to coordinate the recovery plan."), d("coach", "Interviewer", "What action did you take first?")] },
  },
  19: {
    focus: "绩效沟通要基于事实谈成果，也要把改进点转化成下一阶段目标。",
    expressions: [
      e("Let’s review the progress against your goals.", "我们来回顾一下你目标的完成进度。", "用目标作为共同依据。"),
      e("One area you’ve done particularly well is...", "你做得特别好的一点是……", "具体、可信地肯定表现。"),
      e("One development area is...", "一个需要发展的方面是……", "比 weakness 更建设性。"),
      e("What support would help you improve?", "什么支持能帮助你改进？", "把反馈转成行动计划。"),
    ],
    exercise: { type: "rewrite", prompt: "把 You need to communicate better 改成建设性反馈。", answer: "One development area is keeping stakeholders updated during busy periods. What support would help?", explanation: "描述可观察行为，再讨论支持和下一步。" },
    dialogue: { scenario: "你与团队成员进行季度绩效回顾。", hint: "先回顾目标，再给具体反馈，最后讨论支持。", messages: [d("coach", "Team member", "I think the quarter went quite well."), d("user", "你", "Let’s review the progress against your goals. One area you’ve done particularly well is client communication."), d("coach", "Team member", "Thanks. What should I focus on next quarter?")] },
  },
  20: {
    focus: "说服经理时用问题、证据、收益和低风险试点组织表达，而不是只表达个人偏好。",
    expressions: [
      e("I’d like to propose...", "我想提议……", "正式提出方案。"),
      e("The main benefit would be...", "主要收益将是……", "把提案连接到业务结果。"),
      e("The evidence suggests that...", "证据表明……", "用数据或观察增强可信度。"),
      e("Could we test this on a small scale first?", "我们可以先小规模测试吗？", "用试点降低决策风险。"),
    ],
    exercise: { type: "speak", prompt: "用问题、收益和试点说服经理批准一个新工具。", answer: "I’d like to propose a small pilot. The main benefit would be faster reporting, and we could test it with one team first.", explanation: "小规模试点让经理更容易接受新方案。" },
    dialogue: { scenario: "你想说服经理批准一个新的报告工具。", hint: "不要只说 I like it；说明收益并降低风险。", messages: [d("coach", "Manager", "Why should we change the current process?"), d("user", "你", "The evidence suggests that the current process is slowing weekly reporting. Could we test the new tool with one team first?"), d("coach", "Manager", "What would success look like?")] },
  },
};

export const allUnits = sections.flatMap((section) => section.units);

export const audioSources = [
  {
    label: "Collins 官方 ELT 音频资源页",
    url: "https://collins.co.uk/pages/elt-elt-audio-resources",
    kind: "官方入口",
    note: "官方入口；老版教材音频是否开放取决于书籍版本与购买凭证。",
  },
  {
    label: "Unit 1 音频线索（YouTube）",
    url: "https://www.youtube.com/watch?v=q10ROEFHloA",
    kind: "第三方",
    note: "与 Unit 1 / Starting a conversation 相关的第三方上传，未确认授权，不在本站转载音频。",
  },
  {
    label: "Unit 1 Audio 1（YouTube）",
    url: "https://www.youtube.com/watch?v=R8XNivD2w0Q",
    kind: "第三方",
    note: "与 Unit 1 相关的第三方上传，未确认授权，请在原页面核对。",
  },
];
