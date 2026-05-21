# RMS UI/UX 개선안

## 1. 전체 디자인 방향

### 현재 문제점
- 카드 디자인이 평평하고 구분감 없음
- 색상 사용이 일관적이지 않음
- 타이포그래피 계층 구조 부족
- 여백(spacing) 불규칙

### 개선 방향: "Modern Professional"
- 깔끔한 화이트/그레이 톤
- 강조색은 인디고/블루 계열 (기술/전문 느낌)
- 일관된 그림자와 보더-radius
- 명확한 시각적 계층 구조

---

## 2. 구체적 개선 항목

### A. 색상 시스템 (globals.css)

```css
:root {
  /* Primary - Professional Indigo */
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-light: #e0e7ff;
  
  /* Background Layers */
  --bg-page: #f8fafc;        /* 미세한 그레이 */
  --bg-card: #ffffff;
  --bg-elevated: #ffffff;
  
  /* Border */
  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  
  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
}
```

### B. 카드 컴포넌트 개선

**현재:**
- 단순한 흰색 배경
- 그림자 없음 또는 약함
- 보더 불분명

**개선:**
```css
.card-improved {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 
              0 1px 2px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card-improved:hover {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 
              0 2px 4px -1px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}
```

### C. 타이포그래피 계층

| 요소 | 현재 | 개선 |
|------|------|------|
| Page Title | text-2xl font-bold | text-3xl font-semibold tracking-tight |
| Section Title | text-lg | text-xl font-semibold |
| Card Title | text-base | text-lg font-medium |
| Body | text-sm | text-sm leading-relaxed |
| Caption | - | text-xs text-gray-500 |

### D. 헤더 개선

**현재:** 단순한 흰색 헤더
**개선:**
- 그라데이션 또는 브랜드 색상 활용
- 둥근 하단 모서리 (border-radius-bottom)
- 그림자로 depth 추가

### E. 버튼 스타일 통일

**Primary Button:**
```css
.btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}
```

### F. 목록/테이블 개선

- 홀짝 행 배경색 구분 (zebra striping)
- 호버 효과
- 정렬 아이콘 개선
- 빈 상태(empty state) 일러스트 추가

### G. Status Badge 개선

**현재:** 기본 shadcn 뱃지
**개선:**
```css
.badge-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-approved { 
  background: #dcfce7; 
  color: #166534;
  border: 1px solid #86efac;
}

.badge-draft { 
  background: #fef3c7; 
  color: #92400e;
  border: 1px solid #fcd34d;
}
```

---

## 3. 페이지별 개선

### Product Groups 페이지
- [ ] Hero 섹션 추가 (branding)
- [ ] 그리드 레이아웃 개선 (gap 증가)
- [ ] 카드에 아이콘/이미지 추가
- [ ] 통계 요약 카드 추가 (총 그룹 수 등)

### Product 상세 페이지
- [ ] 탭 네비게이션 시각적 개선
- [ ] Variants/Categories를 카드 형태로
- [ ] Requirements 테이블 개선
- [ ] 버전 히스토리 타임라인 형태

### AI Ingestion 페이지
- [ ] 스텝 인디케이터 (Stepper) 추가
- [ ] 로딩 상태 애니메이션 개선
- [ ] 결과 카드 디자인 개선

---

## 4. 구현 우선순위

**P0 (필수):**
1. 색상 시스템 정립 (globals.css)
2. Card 컴포넌트 개선
3. Button 스타일 통일

**P1 (권장):**
4. Badge/Status 개선
5. 헤더 디자인 개선
6. 타이포그래피 계층 정리

**P2 (선택):**
7. 애니메이션 추가
8. 일러스트/아이콘 추가
9. 다크모드 지원

---

## 5. 참고 디자인

- **Linear:** 깔끔한 카드, 미세한 그림자
- **Notion:** 명확한 계층, 일관된 여백
- **Vercel:** 모던한 그라데이션, 프로페셔널 톤
- **GitHub:** Status badge, 테이블 디자인
