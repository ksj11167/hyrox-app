/**
 * Starter decks by job, shipped with the app.
 *
 * The sharing feature people actually want is "let me use the deck someone in
 * my job already made". This is that, minus the backend — and minus the
 * privacy problem, because nothing here came out of anybody's real chat room.
 * They are written the way a Korean office worker actually types on KakaoTalk:
 * short, 존댓말, half-finished sentences — paired with the English a native
 * speaker would use in the same spot, not the textbook version.
 *
 * Each card keeps one line of context for the same reason personal cards do:
 * "그거" only makes sense when you can see what was said before it.
 *
 * When user contributions arrive, they land in this same shape: a Korean line,
 * an English line, a situation tag. Never a conversation log.
 */

export const JOB_DECKS = [
  {
    id: 'common',
    name: '공통',
    blurb: '보고, 요청, 일정 조율, 사과',
    cards: [
      { ko: '확인하고 바로 말씀드릴게요', en: 'Let me check and get right back to you.', situation: '확인 약속', context: [{ speaker: '팀장', text: '이거 언제까지 될까요?' }] },
      { ko: '넵 확인했습니다', en: 'Got it, thanks.', situation: '수신 확인', context: [{ speaker: '팀장', text: '방금 메일 보냈어요' }] },
      { ko: '죄송한데 조금만 늦어질 것 같아요', en: "Sorry, it's going to run a little late.", situation: '지연 알림', context: [{ speaker: '팀장', text: '오늘 마감이죠?' }] },
      { ko: '혹시 내일로 미뤄도 될까요?', en: 'Would tomorrow work instead?', situation: '일정 변경', context: [{ speaker: '동료', text: '오늘 오후에 잠깐 볼까요?' }] },
      { ko: '지금 다른 거 하고 있어서 좀 있다 볼게요', en: "I'm in the middle of something — I'll take a look shortly.", situation: '보류', context: [{ speaker: '동료', text: '이거 한 번만 봐주실 수 있어요?' }] },
      { ko: '그 건은 제가 맡을게요', en: "I'll take that one.", situation: '업무 수락', context: [{ speaker: '팀장', text: '이거 누가 하실래요?' }] },
      { ko: '혹시 지금 통화 가능하세요?', en: 'Do you have a minute for a quick call?', situation: '통화 요청', context: [] },
      { ko: '자료 공유드립니다', en: 'Sharing the files here.', situation: '자료 전달', context: [] },
      { ko: '이 부분은 제가 잘 몰라서요', en: "That's outside what I know well.", situation: '한계 인정', context: [{ speaker: '동료', text: '이거 어떻게 하는지 아세요?' }] },
      { ko: '고생하셨습니다', en: 'Nice work today.', situation: '격려', context: [] },
      { ko: '먼저 들어가 보겠습니다', en: "I'm heading out — see you tomorrow.", situation: '퇴근 인사', context: [] },
      { ko: '다시 한 번만 설명해 주실 수 있을까요?', en: 'Could you walk me through that once more?', situation: '재설명 요청', context: [{ speaker: '팀장', text: '아까 회의에서 말한 대로 진행하시면 돼요' }] },
    ],
  },

  {
    id: 'dev',
    name: '개발',
    blurb: '배포, 장애 대응, 코드 리뷰',
    cards: [
      { ko: '지금 QA 돌리고 있습니다', en: "I'm running QA on it now.", situation: '진행 보고', context: [{ speaker: '팀장', text: '그 배포 건 어떻게 됐어요?' }] },
      { ko: '로컬에선 되는데 서버에서만 나네요', en: "It works locally — it's only failing on the server.", situation: '증상 설명', context: [{ speaker: '동료', text: '저는 재현이 안 되는데요?' }] },
      { ko: '롤백하겠습니다', en: "I'm rolling it back.", situation: '장애 대응', context: [{ speaker: '팀장', text: '지금 서비스 터진 것 같은데요' }] },
      { ko: '원인 파악되면 공유드릴게요', en: "I'll share the root cause once I have it.", situation: '후속 약속', context: [] },
      { ko: '리뷰 부탁드립니다', en: 'Could you take a look at this PR?', situation: '리뷰 요청', context: [] },
      { ko: '코멘트 반영했습니다', en: "I've addressed your comments.", situation: '수정 완료', context: [{ speaker: '리뷰어', text: '몇 개 코멘트 남겼어요' }] },
      { ko: '이건 좀 크게 고쳐야 할 것 같은데요', en: 'I think this needs a bigger change than that.', situation: '이견 제시', context: [{ speaker: '동료', text: '여기만 살짝 고치면 되지 않나요?' }] },
      { ko: '스펙이 좀 애매해서 확인이 필요합니다', en: "The spec is ambiguous here — I need to confirm before I build it.", situation: '요구사항 확인', context: [] },
      { ko: '배포 완료했습니다', en: "The deploy's done.", situation: '완료 보고', context: [] },
      { ko: '테스트 통과했습니다', en: 'All tests are green.', situation: '검증 보고', context: [] },
      { ko: '이거 기존 코드도 같이 깨질 수 있어요', en: 'This could break existing behavior too.', situation: '리스크 경고', context: [] },
      { ko: '일정 다시 잡아야 할 것 같습니다', en: 'I think we need to reset the timeline on this.', situation: '일정 재협의', context: [{ speaker: '팀장', text: '이번 주까지 가능하죠?' }] },
    ],
  },

  {
    id: 'sales',
    name: '영업·세일즈',
    blurb: '미팅 제안, 견적, 팔로업',
    cards: [
      { ko: '다음 주 중에 미팅 한 번 잡을 수 있을까요?', en: 'Could we set up a meeting sometime next week?', situation: '미팅 제안', context: [] },
      { ko: '견적서 보내드렸습니다 확인 부탁드려요', en: "I've sent over the quote — let me know what you think.", situation: '견적 전달', context: [] },
      { ko: '내부 검토 후에 다시 연락드리겠습니다', en: "I'll check internally and get back to you.", situation: '보류 응답', context: [{ speaker: '고객', text: '이 가격에서 조금 더 안 될까요?' }] },
      { ko: '혹시 진행 상황 여쭤봐도 될까요?', en: 'Just checking in — any update on your end?', situation: '팔로업', context: [] },
      { ko: '그 부분은 조정 가능합니다', en: "We have some flexibility there.", situation: '협상', context: [{ speaker: '고객', text: '계약 기간이 좀 부담스러워서요' }] },
      { ko: '죄송하지만 그건 어려울 것 같습니다', en: "I'm afraid that's not something we can do.", situation: '정중한 거절', context: [] },
      { ko: '조건 정리해서 다시 보내드릴게요', en: "I'll put the terms together and send them over.", situation: '후속 조치', context: [] },
      { ko: '이번 건은 저희 쪽에서 맞춰보겠습니다', en: "We'll work with you on this one.", situation: '양보', context: [] },
      { ko: '결정까지 시간이 얼마나 필요하실까요?', en: 'How much time do you need to decide?', situation: '일정 확인', context: [] },
      { ko: '좋은 소식 기다리고 있겠습니다', en: "Looking forward to hearing from you.", situation: '마무리 인사', context: [] },
      { ko: '담당자분 연결해 주실 수 있을까요?', en: 'Could you put me in touch with the right person?', situation: '연결 요청', context: [] },
      { ko: '계약서 검토 중입니다', en: "We're reviewing the contract now.", situation: '진행 보고', context: [] },
    ],
  },

  {
    id: 'pm',
    name: '기획·PM',
    blurb: '우선순위, 범위, 이해관계자 조율',
    cards: [
      { ko: '우선순위 다시 정리해야 할 것 같아요', en: 'I think we need to re-prioritize.', situation: '우선순위 조정', context: [{ speaker: '팀장', text: '이것도 이번 스프린트에 넣을 수 있나요?' }] },
      { ko: '이번 스프린트엔 안 들어갈 것 같습니다', en: "That won't make it into this sprint.", situation: '범위 방어', context: [] },
      { ko: '요구사항 정리해서 문서로 공유드릴게요', en: "I'll write up the requirements and share the doc.", situation: '문서화 약속', context: [] },
      { ko: '이거 왜 필요한지 조금 더 설명해 주실 수 있어요?', en: 'Could you help me understand why we need this?', situation: '배경 확인', context: [{ speaker: '기획자', text: '이 기능 추가해 주세요' }] },
      { ko: '개발팀이랑 먼저 얘기해 볼게요', en: "Let me talk it over with engineering first.", situation: '조율 예고', context: [] },
      { ko: '지금 일정으로는 무리입니다', en: "That's not realistic with the current timeline.", situation: '일정 이견', context: [] },
      { ko: '어디까지 꼭 필요한지 정해야 할 것 같아요', en: 'We should agree on what actually has to be in scope.', situation: '범위 합의', context: [] },
      { ko: '중간에 한 번 같이 보시죠', en: "Let's check in partway through.", situation: '중간 점검 제안', context: [] },
      { ko: '그럼 그렇게 진행하겠습니다', en: "Alright, we'll go with that.", situation: '결정 확정', context: [] },
      { ko: '결정 사항 정리해서 올려두겠습니다', en: "I'll write up what we decided and post it.", situation: '기록', context: [] },
      { ko: '이해관계자들한테 먼저 공유해야 할 것 같아요', en: 'We should loop in the stakeholders before we move.', situation: '사전 공유', context: [] },
      { ko: '다음 스텝이 뭔지 정하고 끝내죠', en: "Let's agree on next steps before we wrap up.", situation: '회의 마무리', context: [] },
    ],
  },

  {
    id: 'design',
    name: '디자인',
    blurb: '시안 공유, 피드백, 수정 요청',
    cards: [
      { ko: '시안 두 가지로 준비해 봤습니다', en: "I've put together two directions.", situation: '시안 공유', context: [] },
      { ko: '피드백 주시면 반영하겠습니다', en: "Send over your feedback and I'll work it in.", situation: '피드백 요청', context: [] },
      { ko: '어떤 점이 아쉬우신지 조금 더 구체적으로 말씀해 주실 수 있을까요?', en: 'Could you be a bit more specific about what feels off?', situation: '피드백 구체화', context: [{ speaker: '팀장', text: '뭔가 좀 아쉬운데요' }] },
      { ko: '그렇게 하면 다른 화면이랑 안 맞아요', en: "That would break consistency with the other screens.", situation: '이견 제시', context: [] },
      { ko: '수정본 올려두었습니다', en: "I've uploaded the revised version.", situation: '수정 완료', context: [] },
      { ko: '이 버전이 더 나은 것 같아요', en: 'I think this version works better.', situation: '의견 제시', context: [] },
      { ko: '개발 가능한지 먼저 확인해 볼게요', en: "Let me check whether this is feasible to build.", situation: '실현성 확인', context: [] },
      { ko: '레퍼런스 몇 개 공유드립니다', en: 'Sharing a few references here.', situation: '참고자료 전달', context: [] },
      { ko: '조금만 더 시간 주시면 정리해서 드릴게요', en: 'Give me a bit more time and I\'ll have it cleaned up.', situation: '시간 요청', context: [] },
      { ko: '여기는 의도한 겁니다', en: "That part is intentional.", situation: '의도 설명', context: [{ speaker: '팀장', text: '여기 간격이 좀 넓지 않나요?' }] },
      { ko: '최종본으로 확정해도 될까요?', en: 'Can we lock this in as final?', situation: '확정 요청', context: [] },
      { ko: '에셋 전달드렸습니다', en: "I've handed off the assets.", situation: '전달 완료', context: [] },
    ],
  },
];

/** Deck by id, or undefined. */
export const findDeck = (id) => JOB_DECKS.find((d) => d.id === id);
