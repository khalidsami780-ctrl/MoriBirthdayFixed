/*
HOW TO ADD NEW TIP:

Copy this:

{
  id: "tip-XXX",
  title: "",
  text: "Your advice/tip",
  media: [],
  createdAt: Date.now()
}

Then paste inside the array and edit.

Notes:
- media is optional (you can place links using the "link" type in media)
- you can add multiple media items
- leave media: [] if no media
media: [
  { type: "image", url: "https://example.com/img1.jpg" },
  { type: "image", url: "https://example.com/img2.jpg" },
  { type: "video", url: "https://example.com/video.mp4" },
  { type: "audio", url: "https://example.com/audio.mp3" },
  { type: "link", url: "https://youtube.com/..." }
]
*/

export const tips = [
  {
    id: "tip-012",
    title: 'يا حي يا قيوم برحمتك استغيث',
    text: `عرفت ليه حبيبنا النبي صل الله عليه و سلم كان بيدعي و يقول ..

يا حي يا قيوم برحمتك استغيث أصلح لي شأني كله و لا تكلني إلي (نفسي) طرفة عين ؟؟ 

النفس لو تملكت من زمام الامر هلكت هلكت ، 
الإنسان ما هو إلا نفسية .. ولو ضاقت عجز عن عمل الدنيا والآخرة

 وعشان كدا كان سيدنا محمد ﷺ يستعيذ من الهم والغم والحزن في صباحه ومسائه

اللهم إنِّي أعوذ بك من الهم والحزن ، وأعوذ بك من العجز والكسل ، وأعوذ بك من الجبن والبخل ، وأعوذ بك من غلبة الدين وقهر الرجال`,
    media: [],
    createdAt: new Date("2026-04-13T15:00:00").getTime(),
  },
  {
    id: "tip-011",
    title: ' جزء2 خطة حفظ ومراجعة القراّن',
    text: `الجزء الثاني من الخطة `,
    media: [
      { type: 'link', url: 'https://youtu.be/UvaDLtO99ks?si=-1xVPARBbJN3v85p' }
    ],
    createdAt: new Date("2026-03-25").getTime(),
  },
  {
    id: "tip-010",
    title: 'خطة حفظ ومراجعة القراّن',
    text: `الجزء الاول من الخطة اسمعي الفيديو على 1.5 و مش هوصيكي \n اكتبي وراه وانتي ما شاء الله ملكة الكتابة😊 \n مش عاوزك تقلقي من موضوع اني بكتبلك هنا بس اعتبريه خوفا عليك ونصيحة \n اللي بينا كتيير  و كمان الله اعلم يمكن يكون مستقبلنا سوى ف اهو بنساعد بعض  `,
    media: [
      { type: 'link', url: 'https://youtu.be/Zxlw4w9BPjM?si=a45O_z6a0rRhfURd' }
    ],
    createdAt: new Date("2026-03-24").getTime(),
  },
  {
    id: "tip-009",
    title: 'اليقين',
    text: `اليقين…
ليس أن ترى الطريق واضحًا
بل أن تمشي فيه مطمئنًا`,
    media: [],
    createdAt: new Date("2026-03-23").getTime(),
  },
  {
    id: "tip-008",
    title: 'وهنا…',
    text: `وهنا…
ستُكتب كلمات أخرى من حين لآخر

لمن يهمه أن يقرأ`,
    media: [],
    createdAt: new Date("2026-03-23").getTime(),
  },
  {
    id: "tip-007",
    title: 'قبل النوم',
    text: `قبل النوم:
33 سبحان الله
33 الحمد لله
34 الله أكبر

وصية عظيمة…
تمنح القلب سكينة، والجسد قوة
سنة النبي ﷺ قبل النوم هي
 التسبيح 33، والتحميد 33، والتكبير 34 (أو 33) مرة، 
 وتسمى "تسبيح فاطمة". وصى بها النبي ﷺ عليًا وفاطمة رضي الله عنهما،
  وهي خير من خادم وتُكسب قوة في البدن واليوم، وتُقرأ عند النوم لغفران الذنوب.
  بمعنى ان لما تعملي كدا هتصحى تاني يوم نشاط و حيوية حتى او نايمة ساعة واحدة 
اهم حاجة اليقين والثقة بالله وان كل عمل لله 
ذي ما انا على يقين ان ربنا هيجمعنا`,
    media: [],
    createdAt: new Date("2026-03-22").getTime(),
  },
  {
    id: "tip-006",
    title: ' رسالة امتنان و شكر ليك ',
    text: `شكرًا… على معلومة لم تكن عابرة

قيام الليل بسورة السجدة
كانت بداية… ثم عادة… ثم طمأنينة

ومعها الواقعة والملك…
كأن اليوم يُغلق بهدوء`,
    media: [],
    createdAt: new Date("2026-03-21").getTime(),
  },
  {
    id: "tip-005",
    title: 'مساحة الوعي',
    text: ` الجروب دا كمان تابعيه كمية طاقة إيجابية رهيبة هو كمان متستغربيش اني فيه ،
     بس عشان بشوف البوستات التوعوية اللي اقدر اساعد بيها امي و اختي فى اي حاجة :`,
    media: [
      { type: 'link', url: 'https://www.facebook.com/share/g/1CNWGcFWyL/' }
    ],
    createdAt: new Date("2026-03-20").getTime(),
  },
  {
    id: "tip-004",
    title: 'أماكن تمنحكِ طاقة',
    text: `هناك أماكن…
لا تُعطيك فقط معلومات،
بل تمنحك طاقة تُعينك على الاستمرار`,
    media: [
      { type: 'link', url: 'https://www.facebook.com/share/g/1GoxbgUqsu/' }
    ],
    createdAt: new Date("2026-03-19").getTime(),
  },
  {
    id: "tip-003",
    title: 'و دي نصيحة أنا كنت كاتبها بنفسي ',
    text: `نصيحة كنت أحتاجها يومًا…
فأحببت أن أتركها هنا`,
    media: [
      { type: 'link', url: 'https://www.facebook.com/share/p/1QcnzN8FmS/' }
    ],
    createdAt: new Date("2026-03-18").getTime(),
  },
  {
    id: "tip-002",
    title: 'فضل الدعاء',
    text: `فضل الدعاء
فهو الباب الذي لا يُغلق،
 والطريق الذي لا يُخيّب من صدق فيه
دا بوست بيسال الناس عن فضل دعواتهم لربهم باللي عايزينه قولت اضيفه يمكن يحفزك شوية 
فى الدعاء عامة .`,
    media: [
      { type: 'link', url: 'https://www.facebook.com/share/p/1R2wNGPWVf/' }
    ],
    createdAt: new Date("2026-03-17").getTime(),
  },
  {
    id: "tip-001",
    title: 'نصائح… في صمت',
    text: `بعض النصائح… تُكتب لشخص واحد، لكنها تنفع الجميع

نصائح… في صمت

ليست كل الكلمات تُقال لنُسمع،
بعضها يُكتب… لعلها تنفع`,
    media: [],
    createdAt: new Date("2026-03-16").getTime(),
  }
];
