import type { Content, ContentColumns, TDocumentDefinitions } from 'pdfmake/interfaces';

interface TicketData {
  id: string;
  event: {
    title: string;
    date: string;
    location: string;
    organizer_name?: string;
    organizer_logo_url?: string;
    sponsor_logos?: Array<{ url: string; name: string }>;
  };
  buyer_name: string;
  buyer_phone: string;
  purchase_channel: string;
  confirmation_code?: string;
}

type SponsorWithData = NonNullable<TicketData['event']['sponsor_logos']>[number] & {
  dataUrl: string | null;
};

type ColumnDefinition = NonNullable<ContentColumns['columns']>[number];

export async function generateTicketPDF(ticketData: TicketData): Promise<Blob> {
  // Dynamically import pdfMake only in browser environment
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  // Handle different module structures that might be returned
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;

  // Safely access vfs property
  let vfs: any;
  if (pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
    vfs = (pdfFonts as any).pdfMake.vfs;
  } else if (pdfFonts && (pdfFonts as any).vfs) {
    vfs = (pdfFonts as any).vfs;
  }

  // Set vfs globally for safety
  if (vfs) {
    (pdfMake as any).vfs = vfs;
  }

  // Define the standard fonts using the vfs
  const fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };

  // Approximate content width for A6 (297pt width - 24pt margins)
  const contentWidth = 273;

  // Generate QR code as data URL
  const QRCode = (await import("qrcode")).default;
  const qrCodeDataUrl = await QRCode.toDataURL(ticketData.id, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff"
    }
  });

  // Convert data URL to base64
  const base64QR = qrCodeDataUrl.split(',')[1];

  const fetchImageAsDataUrl = async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl || typeof window === 'undefined') {
      return null;
    }

    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch image for PDF rendering:', error);
      return null;
    }
  };

  const organizerLogoDataUrl = ticketData.event.organizer_logo_url
    ? await fetchImageAsDataUrl(ticketData.event.organizer_logo_url)
    : null;

  const sponsorLogosWithData: SponsorWithData[] = ticketData.event.sponsor_logos?.length
    ? await Promise.all(
      ticketData.event.sponsor_logos.map(async sponsor => ({
        ...sponsor,
        dataUrl: await fetchImageAsDataUrl(sponsor.url)
      }))
    )
    : [];

  // Prepare content array for PDF
  const content: Content[] = [];

  // ========== HEADER SECTION ==========
  // Beautiful header with organizer branding
  const headerStack: Content[] = [];

  // Organizer Logo and Name in header with enhanced styling
  if (organizerLogoDataUrl) {
    headerStack.push({
      columns: [
        {
          width: 'auto',
          image: organizerLogoDataUrl,
          fit: [50, 40],
          alignment: 'center' as const,
          margin: [0, 0, 8, 0]
        },
        {
          width: '*',
          text: ticketData.event.organizer_name || 'TIPAC',
          fontSize: 18,
          bold: true,
          color: '#8B0000',
          margin: [0, 8, 0, 0]
        }
      ] as any[],
      columnGap: 6,
      margin: [0, 0, 0, 6]
    });
  } else {
    headerStack.push({
      text: ticketData.event.organizer_name || 'TIPAC',
      fontSize: 20,
      bold: true,
      color: '#8B0000',
      alignment: 'center' as const,
      margin: [0, 0, 0, 8]
    });
  }

  content.push({
    stack: headerStack,
    margin: [0, 0, 0, 4]
  });

  // Enhanced decorative divider with gradient effect
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: contentWidth,
        y2: 0,
        lineWidth: 2,
        lineColor: '#8B0000'
      },
      {
        type: 'line',
        x1: 0,
        y1: 3,
        x2: contentWidth,
        y2: 3,
        lineWidth: 1,
        lineColor: '#FFD700'
      }
    ],
    margin: [0, 0, 0, 8]
  });

  // Event title with enhanced styling
  content.push(
    {
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: contentWidth,
          h: 32,
          color: '#8B0000',
          r: 6 // rounded corners
        }
      ]
    },
    {
      text: ticketData.event.title.toUpperCase(),
      fontSize: 14,
      bold: true,
      color: 'white',
      alignment: 'center' as const,
      margin: [0, -22, 0, 10]
    }
  );

  // Event details with icons and better formatting
  content.push({
    table: {
      widths: ['22%', '78%'],
      body: [
        [
          { text: '📅 Date:', bold: true, fontSize: 9, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 1] },
          {
            text: new Date(ticketData.event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }), fontSize: 9, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 1]
          }
        ],
        [
          { text: '📍 Venue:', bold: true, fontSize: 9, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 1] },
          { text: ticketData.event.location, fontSize: 9, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 1] }
        ]
      ]
    },
    margin: [0, 0, 0, 8]
  });

  // Ticket details header with enhanced background
  content.push({
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        w: contentWidth,
        h: 18,
        color: '#F5F5F5',
        r: 4
      }
    ]
  });

  content.push({
    text: 'TICKET INFORMATION',
    fontSize: 11,
    bold: true,
    color: '#8B0000',
    alignment: 'center' as const,
    margin: [0, -14, 0, 6]
  });

  // Ticket details in a clean table format
  const ticketDetailsBody: any[] = [
    [
      { text: '🎫 Ticket ID:', bold: true, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#333333', margin: [0, 1, 0, 2] },
      { text: ticketData.id.substring(0, 12).toUpperCase(), fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#555555', margin: [0, 1, 0, 2] }
    ],
    [
      { text: '👤 Full Name:', bold: true, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#333333', margin: [0, 1, 0, 2] },
      { text: ticketData.buyer_name, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#555555', margin: [0, 1, 0, 2] }
    ],
    [
      { text: '📱 Phone Number:', bold: true, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#333333', margin: [0, 1, 0, 2] },
      { text: ticketData.buyer_phone, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#555555', margin: [0, 1, 0, 2] }
    ],
    [
      { text: '💳 Purchase Channel:', bold: true, fontSize: 8, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 2] },
      { text: ticketData.purchase_channel, fontSize: 8, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 2] }
    ]
  ];

  // Add confirmation code if it exists
  if (ticketData.confirmation_code) {
    ticketDetailsBody.push([
      { text: '✓ Confirmation Code:', bold: true, fontSize: 8, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 2] },
      { text: ticketData.confirmation_code, fontSize: 8, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 2] }
    ]);
  }

  content.push({
    table: {
      widths: ['35%', '65%'],
      body: ticketDetailsBody
    },
    margin: [0, 0, 0, 6]
  });

  // QR Code section with enhanced label
  content.push({
    text: 'SCAN TO VERIFY TICKET',
    fontSize: 8,
    bold: true,
    color: '#666666',
    alignment: 'center' as const,
    margin: [0, 4, 0, 4]
  });

  content.push({
    image: `data:image/png;base64,${base64QR}`,
    width: 90,
    height: 90,
    alignment: 'center' as const,
    margin: [0, 0, 0, 2]
  });

  content.push({
    text: ticketData.id.substring(0, 12).toUpperCase(),
    fontSize: 7,
    color: '#999999',
    alignment: 'center' as const,
    margin: [0, 0, 0, 6]
  });

  // ========== FOOTER SECTION ==========
  // Enhanced decorative divider before footer
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: contentWidth,
        y2: 0,
        lineWidth: 1,
        lineColor: '#8B0000'
      },
      {
        type: 'line',
        x1: 0,
        y1: 3,
        x2: contentWidth,
        y2: 3,
        lineWidth: 0.5,
        lineColor: '#CCCCCC',
        dash: { length: 4 }
      }
    ],
    margin: [0, 2, 0, 6]
  });

  // Sponsor logos section with names
  if (sponsorLogosWithData.length > 0) {
    const sponsorSection: Content[] = [];

    // "Proudly Sponsored By" header
    sponsorSection.push({
      text: 'PROUDLY SPONSORED BY',
      fontSize: 9,
      bold: true,
      color: '#8B0000',
      alignment: 'center' as const,
      margin: [0, 0, 0, 4]
    });

    // Add sponsor logos with names in a more compact grid layout
    const sponsorItems: ColumnDefinition[] = [];

    for (const sponsor of sponsorLogosWithData) {
      const stackItems: Content[] = [];

      if (sponsor.dataUrl) {
        stackItems.push({
          image: sponsor.dataUrl,
          fit: [40, 25],
          alignment: 'center' as const,
          margin: [0, 0, 0, 2]
        });
      }

      stackItems.push({
        text: sponsor.name,
        fontSize: 5,
        alignment: 'center' as const,
        color: '#555555',
        margin: [0, 2, 0, 0]
      });

      sponsorItems.push({
        stack: stackItems,
        width: '*',
        margin: [2, 0, 2, 4]
      });
    }

    // Arrange sponsors in rows of 3 (more balanced layout)
    const rows: ContentColumns[] = [];
    for (let i = 0; i < sponsorItems.length; i += 3) {
      const rowItems = sponsorItems.slice(i, i + 3);
      rows.push({
        columns: rowItems,
        alignment: 'center' as const,
        columnGap: 4,
        margin: [0, 0, 0, 2]
      } as ContentColumns);
    }

    sponsorSection.push(...rows);

    content.push({
      stack: sponsorSection,
      margin: [0, 0, 0, 6]
    });
  }

  // Final footer with enhanced thank you message
  content.push(
    {
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: contentWidth,
          h: 24,
          color: '#8B0000',
          r: 4
        }
      ]
    },
    {
      stack: [
        {
          text: 'THANK YOU FOR YOUR PURCHASE!',
          fontSize: 9,
          bold: true,
          color: 'white',
          alignment: 'center' as const,
          margin: [0, 2, 0, 2]
        },
        {
          text: 'Please present this ticket at the entrance',
          fontSize: 7,
          color: '#FFD700',
          alignment: 'center' as const,
          margin: [0, 0, 0, 0]
        }
      ],
      margin: [0, -18, 0, 0]
    }
  );

  // Define the PDF document
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A6' as const,
    pageMargins: [12, 12, 12, 12] as [number, number, number, number],
    content,
    defaultStyle: {
      font: 'Roboto'
    }
  };

  // Create the PDF, passing the fonts definition
  const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts);

  return new Promise<Blob>((resolve) => {
    pdfDoc.getBlob((blob: Blob) => {
      resolve(blob);
    });
  });
}

export async function generateMultiTicketPDF(ticketsData: TicketData[]): Promise<Blob> {
  // Dynamically import pdfMake only in browser environment
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  // Handle different module structures that might be returned
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;

  // Safely access vfs property
  let vfs: any;
  if (pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
    vfs = (pdfFonts as any).pdfMake.vfs;
  } else if (pdfFonts && (pdfFonts as any).vfs) {
    vfs = (pdfFonts as any).vfs;
  }

  // Set vfs globally for safety
  if (vfs) {
    (pdfMake as any).vfs = vfs;
  }

  // Define the standard fonts using the vfs
  const fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };

  const fetchImageAsDataUrl = async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl || typeof window === 'undefined') {
      return null;
    }

    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch image for PDF rendering:', error);
      return null;
    }
  };

  // Create content array for all tickets
  const content: Content[] = [];

  // Add a cover page
  content.push({
    text: 'YOUR TIPAC TICKETS',
    fontSize: 24,
    bold: true,
    color: '#8B0000',
    alignment: 'center' as const,
    margin: [0, 30, 0, 30]
  });

  content.push({
    text: `Total Tickets: ${ticketsData.length}`,
    fontSize: 16,
    alignment: 'center' as const,
    margin: [0, 0, 0, 50]
  });

  // Process each ticket
  for (let i = 0; i < ticketsData.length; i++) {
    const ticketData = ticketsData[i];
    
    // Add a page break before each ticket except the first one
    if (i > 0) {
      content.push({ text: '', pageBreak: 'before' });
    }

    // Approximate content width for A6 (297pt width - 24pt margins)
    const contentWidth = 273;

    // Generate QR code as data URL
    const QRCode = (await import("qrcode")).default;
    const qrCodeDataUrl = await QRCode.toDataURL(ticketData.id, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });

    // Convert data URL to base64
    const base64QR = qrCodeDataUrl.split(',')[1];

    const organizerLogoDataUrl = ticketData.event.organizer_logo_url
      ? await fetchImageAsDataUrl(ticketData.event.organizer_logo_url)
      : null;

    const sponsorLogosWithData: SponsorWithData[] = ticketData.event.sponsor_logos?.length
      ? await Promise.all(
        ticketData.event.sponsor_logos.map(async sponsor => ({
          ...sponsor,
          dataUrl: await fetchImageAsDataUrl(sponsor.url)
        }))
      )
      : [];

    // Prepare content array for this ticket
    const ticketContent: Content[] = [];

    // ========== HEADER SECTION ==========
    // Beautiful header with organizer branding
    const headerStack: Content[] = [];

    // Organizer Logo and Name in header with enhanced styling
    if (organizerLogoDataUrl) {
      headerStack.push({
        columns: [
          {
            width: 'auto',
            image: organizerLogoDataUrl,
            fit: [50, 40],
            alignment: 'center' as const,
            margin: [0, 0, 8, 0]
          },
          {
            width: '*',
            text: ticketData.event.organizer_name || 'TIPAC',
            fontSize: 18,
            bold: true,
            color: '#8B0000',
            margin: [0, 8, 0, 0]
          }
        ] as any[],
        columnGap: 6,
        margin: [0, 0, 0, 6]
      });
    } else {
      headerStack.push({
        text: ticketData.event.organizer_name || 'TIPAC',
        fontSize: 20,
        bold: true,
        color: '#8B0000',
        alignment: 'center' as const,
        margin: [0, 0, 0, 8]
      });
    }

    ticketContent.push({
      stack: headerStack,
      margin: [0, 0, 0, 4]
    });

    // Enhanced decorative divider with gradient effect
    ticketContent.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: contentWidth,
          y2: 0,
          lineWidth: 2,
          lineColor: '#8B0000'
        },
        {
          type: 'line',
          x1: 0,
          y1: 3,
          x2: contentWidth,
          y2: 3,
          lineWidth: 1,
          lineColor: '#FFD700'
        }
      ],
      margin: [0, 0, 0, 8]
    });

    // Event title with enhanced styling
    ticketContent.push(
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: contentWidth,
            h: 32,
            color: '#8B0000',
            r: 6 // rounded corners
          }
        ]
      },
      {
        text: ticketData.event.title.toUpperCase(),
        fontSize: 14,
        bold: true,
        color: 'white',
        alignment: 'center' as const,
        margin: [0, -22, 0, 10]
      }
    );

    // Event details with icons and better formatting
    ticketContent.push({
      table: {
        widths: ['22%', '78%'],
        body: [
          [
            { text: '📅 Date:', bold: true, fontSize: 9, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 1] },
            {
              text: new Date(ticketData.event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }), fontSize: 9, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 1]
            }
          ],
          [
            { text: '📍 Venue:', bold: true, fontSize: 9, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 1] },
            { text: ticketData.event.location, fontSize: 9, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 1] }
          ]
        ]
      },
      margin: [0, 0, 0, 8]
    });

    // Ticket details header with enhanced background
    ticketContent.push({
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: contentWidth,
          h: 18,
          color: '#F5F5F5',
          r: 4
        }
      ]
    });

    ticketContent.push({
      text: 'TICKET INFORMATION',
      fontSize: 11,
      bold: true,
      color: '#8B0000',
      alignment: 'center' as const,
      margin: [0, -14, 0, 6]
    });

    // Ticket details in a clean table format
    const ticketDetailsBody: any[] = [
      [
        { text: '🎫 Ticket ID:', bold: true, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#333333', margin: [0, 1, 0, 2] },
        { text: ticketData.id.substring(0, 12).toUpperCase(), fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#555555', margin: [0, 1, 0, 2] }
      ],
      [
        { text: '👤 Full Name:', bold: true, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#333333', margin: [0, 1, 0, 2] },
        { text: ticketData.buyer_name, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#555555', margin: [0, 1, 0, 2] }
      ],
      [
        { text: '📱 Phone Number:', bold: true, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#333333', margin: [0, 1, 0, 2] },
        { text: ticketData.buyer_phone, fontSize: 8, border: [false, false, false, true], borderColor: ['', '', '', '#EEEEEE'], color: '#555555', margin: [0, 1, 0, 2] }
      ],
      [
        { text: '💳 Purchase Channel:', bold: true, fontSize: 8, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 2] },
        { text: ticketData.purchase_channel, fontSize: 8, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 2] }
      ]
    ];

    // Add confirmation code if it exists
    if (ticketData.confirmation_code) {
      ticketDetailsBody.push([
        { text: '✓ Confirmation Code:', bold: true, fontSize: 8, border: [false, false, false, false], color: '#333333', margin: [0, 1, 0, 2] },
        { text: ticketData.confirmation_code, fontSize: 8, border: [false, false, false, false], color: '#555555', margin: [0, 1, 0, 2] }
      ]);
    }

    ticketContent.push({
      table: {
        widths: ['35%', '65%'],
        body: ticketDetailsBody
      },
      margin: [0, 0, 0, 6]
    });

    // QR Code section with enhanced label
    ticketContent.push({
      text: 'SCAN TO VERIFY TICKET',
      fontSize: 8,
      bold: true,
      color: '#666666',
      alignment: 'center' as const,
      margin: [0, 4, 0, 4]
    });

    ticketContent.push({
      image: `data:image/png;base64,${base64QR}`,
      width: 90,
      height: 90,
      alignment: 'center' as const,
      margin: [0, 0, 0, 2]
    });

    ticketContent.push({
      text: ticketData.id.substring(0, 12).toUpperCase(),
      fontSize: 7,
      color: '#999999',
      alignment: 'center' as const,
      margin: [0, 0, 0, 6]
    });

    // ========== FOOTER SECTION ==========
    // Enhanced decorative divider before footer
    ticketContent.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: contentWidth,
          y2: 0,
          lineWidth: 1,
          lineColor: '#8B0000'
        },
        {
          type: 'line',
          x1: 0,
          y1: 3,
          x2: contentWidth,
          y2: 3,
          lineWidth: 0.5,
          lineColor: '#CCCCCC',
          dash: { length: 4 }
        }
      ],
      margin: [0, 2, 0, 6]
    });

    // Sponsor logos section with names
    if (sponsorLogosWithData.length > 0) {
      const sponsorSection: Content[] = [];

      // "Proudly Sponsored By" header
      sponsorSection.push({
        text: 'PROUDLY SPONSORED BY',
        fontSize: 9,
        bold: true,
        color: '#8B0000',
        alignment: 'center' as const,
        margin: [0, 0, 0, 4]
      });

      // Add sponsor logos with names in a more compact grid layout
      const sponsorItems: ColumnDefinition[] = [];

      for (const sponsor of sponsorLogosWithData) {
        const stackItems: Content[] = [];

        if (sponsor.dataUrl) {
          stackItems.push({
            image: sponsor.dataUrl,
            fit: [40, 25],
            alignment: 'center' as const,
            margin: [0, 0, 0, 2]
          });
        }

        stackItems.push({
          text: sponsor.name,
          fontSize: 5,
          alignment: 'center' as const,
          color: '#555555',
          margin: [0, 2, 0, 0]
        });

        sponsorItems.push({
          stack: stackItems,
          width: '*',
          margin: [2, 0, 2, 4]
        });
      }

      // Arrange sponsors in rows of 3 (more balanced layout)
      const rows: ContentColumns[] = [];
      for (let i = 0; i < sponsorItems.length; i += 3) {
        const rowItems = sponsorItems.slice(i, i + 3);
        rows.push({
          columns: rowItems,
          alignment: 'center' as const,
          columnGap: 4,
          margin: [0, 0, 0, 2]
        });
      }

      sponsorSection.push(...rows);

      ticketContent.push({
        stack: sponsorSection,
        margin: [0, 0, 0, 6]
      });
    }

    // Final footer with enhanced thank you message
    ticketContent.push(
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: contentWidth,
            h: 24,
            color: '#8B0000',
            r: 4
          }
        ]
      },
      {
        stack: [
          {
            text: 'THANK YOU FOR YOUR PURCHASE!',
            fontSize: 9,
            bold: true,
            color: 'white',
            alignment: 'center' as const,
            margin: [0, 2, 0, 2]
          },
          {
            text: 'Please present this ticket at the entrance',
            fontSize: 7,
            color: '#FFD700',
            alignment: 'center' as const,
            margin: [0, 0, 0, 0]
          }
        ],
        margin: [0, -18, 0, 0]
      }
    );

    // Add this ticket's content to the main content array
    content.push({
      stack: ticketContent,
      unbreakable: true
    });
  }

  // Define the PDF document
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A6' as const,
    pageMargins: [12, 12, 12, 12] as [number, number, number, number],
    content,
    defaultStyle: {
      font: 'Roboto'
    }
  };

  // Create the PDF, passing the fonts definition
  const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts);

  return new Promise<Blob>((resolve) => {
    pdfDoc.getBlob((blob: Blob) => {
      resolve(blob);
    });
  });
}