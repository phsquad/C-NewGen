import { ControlType } from '../types/ast';

export interface EventCategoryDefinition {
  category: 'Action' | 'Mouse' | 'Keyboard' | 'Window';
  title: string;
  iconName: string;
  events: {
    name: string;
    delegateSignature: string;
    description: string;
    isDefault?: boolean;
  }[];
}

/**
 * Returns default primary event for a control type (99% use case)
 */
export function getDefaultEventForControl(type: ControlType | string): {
  eventName: string;
  signature: string;
  description: string;
} {
  switch (type) {
    case 'Button':
      return {
        eventName: 'Click',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Обработка нажатия на кнопку',
      };
    case 'TextBox':
      return {
        eventName: 'TextChanged',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Реакция на ввод или стирание символов',
      };
    case 'CheckBox':
    case 'RadioButton':
      return {
        eventName: 'CheckedChanged',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Переключение состояния галочки',
      };
    case 'ComboBox':
    case 'ListBox':
      return {
        eventName: 'SelectedIndexChanged',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Выбор нового элемента из списка',
      };
    case 'DateTimePicker':
    case 'NumericUpDown':
    case 'ProgressBar':
      return {
        eventName: 'ValueChanged',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Смена числового значения, прогресса или даты/времени',
      };
    case 'Form':
      return {
        eventName: 'Load',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Инициализация данных при запуске окна',
      };
    case 'PictureBox':
      return {
        eventName: 'Click',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Клик по изображению',
      };
    default:
      return {
        eventName: 'Click',
        signature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Основное действие компонента',
      };
  }
}

/**
 * Returns structured, categorized events for inspector panel
 */
export function getCategorizedEventsForControl(type: ControlType | string): EventCategoryDefinition[] {
  const defaultEvt = getDefaultEventForControl(type);

  if (type === 'Form') {
    return [
      {
        category: 'Window',
        title: '▼ Окно / Форма (Window & Lifecycle)',
        iconName: 'Layout',
        events: [
          {
            name: 'Load',
            delegateSignature: 'EventHandler(object? sender, EventArgs e)',
            description: 'Инициализация данных при первом открытии окна',
            isDefault: true,
          },
          {
            name: 'FormClosing',
            delegateSignature: 'FormClosingEventHandler(object? sender, FormClosingEventArgs e)',
            description: 'Подтверждение выхода из программы или отмена закрытия',
          },
          {
            name: 'FormClosed',
            delegateSignature: 'FormClosedEventHandler(object? sender, FormClosedEventArgs e)',
            description: 'Срабатывает после окончательного закрытия формы',
          },
          {
            name: 'Resize',
            delegateSignature: 'EventHandler(object? sender, EventArgs e)',
            description: 'Срабатывает при изменении размеров окна',
          },
          {
            name: 'Activated',
            delegateSignature: 'EventHandler(object? sender, EventArgs e)',
            description: 'Получение фокуса окном приложения',
          },
        ],
      },
      {
        category: 'Mouse',
        title: '▼ Мышь (Mouse)',
        iconName: 'MousePointer',
        events: [
          {
            name: 'Click',
            delegateSignature: 'EventHandler(object? sender, EventArgs e)',
            description: 'Клик по свободной области формы',
          },
          {
            name: 'DoubleClick',
            delegateSignature: 'EventHandler(object? sender, EventArgs e)',
            description: 'Двойной клик по форме',
          },
        ],
      },
    ];
  }

  const actionEvents = [];
  if (type === 'Button' || type === 'PictureBox') {
    actionEvents.push(
      {
        name: 'Click',
        delegateSignature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Обработка нажатия на элемент',
        isDefault: defaultEvt.eventName === 'Click',
      },
      {
        name: 'DoubleClick',
        delegateSignature: 'EventHandler(object? sender, EventArgs e)',
        description: 'Двойной клик по элементу',
      }
    );
  } else if (type === 'TextBox') {
    actionEvents.push({
      name: 'TextChanged',
      delegateSignature: 'EventHandler(object? sender, EventArgs e)',
      description: 'Реакция на ввод или стирание символов',
      isDefault: true,
    });
  } else if (type === 'CheckBox' || type === 'RadioButton') {
    actionEvents.push({
      name: 'CheckedChanged',
      delegateSignature: 'EventHandler(object? sender, EventArgs e)',
      description: 'Переключение логического состояния',
      isDefault: true,
    });
  } else if (type === 'ComboBox' || type === 'ListBox') {
    actionEvents.push({
      name: 'SelectedIndexChanged',
      delegateSignature: 'EventHandler(object? sender, EventArgs e)',
      description: 'Выбор нового элемента из выпадающего списка',
      isDefault: true,
    });
  } else if (type === 'DateTimePicker' || type === 'NumericUpDown' || type === 'ProgressBar') {
    actionEvents.push({
      name: 'ValueChanged',
      delegateSignature: 'EventHandler(object? sender, EventArgs e)',
      description: 'Смена числового значения или даты',
      isDefault: true,
    });
  } else {
    actionEvents.push({
      name: 'Click',
      delegateSignature: 'EventHandler(object? sender, EventArgs e)',
      description: 'Основное действие',
      isDefault: true,
    });
  }

  return [
    {
      category: 'Action',
      title: '▼ Действия (Action)',
      iconName: 'Zap',
      events: actionEvents,
    },
    {
      category: 'Mouse',
      title: '▼ Мышь (Mouse)',
      iconName: 'MousePointer',
      events: [
        {
          name: 'MouseEnter',
          delegateSignature: 'EventHandler(object? sender, EventArgs e)',
          description: 'Наведение курсора мыши на область контрола',
        },
        {
          name: 'MouseLeave',
          delegateSignature: 'EventHandler(object? sender, EventArgs e)',
          description: 'Уход курсора мыши за границы контрола',
        },
        {
          name: 'MouseDown',
          delegateSignature: 'MouseEventHandler(object? sender, MouseEventArgs e)',
          description: 'Нажатие любой кнопки мыши',
        },
        {
          name: 'MouseUp',
          delegateSignature: 'MouseEventHandler(object? sender, MouseEventArgs e)',
          description: 'Отпускание кнопки мыши',
        },
      ],
    },
    {
      category: 'Keyboard',
      title: '▼ Клавиатура и фокус (Focus/Key)',
      iconName: 'Keyboard',
      events: [
        {
          name: 'KeyDown',
          delegateSignature: 'KeyEventHandler(object? sender, KeyEventArgs e)',
          description: 'Нажатие клавиши на клавиатуре',
        },
        {
          name: 'KeyPress',
          delegateSignature: 'KeyPressEventHandler(object? sender, KeyPressEventArgs e)',
          description: 'Ввод символьного знака (ASCII/Unicode)',
        },
        {
          name: 'Enter',
          delegateSignature: 'EventHandler(object? sender, EventArgs e)',
          description: 'Получение фокуса элементом управления',
        },
        {
          name: 'Leave',
          delegateSignature: 'EventHandler(object? sender, EventArgs e)',
          description: 'Потеря фокуса элементом управления',
        },
      ],
    },
  ];
}

/**
 * Generates sample method body for Form1.cs snippet preview
 */
export function getLiveEventMethodSnippet(
  handlerName: string,
  controlName: string,
  eventName: string,
  controlType: string
): string {
  let innerBody = '';
  if (eventName === 'Click') {
    innerBody = `    // TODO: Ваш исполняемый код логики:
    MessageBox.Show("Действие выполнено успешно!", "${controlName}");`;
  } else if (eventName === 'TextChanged') {
    innerBody = `    // TODO: Обработка изменения текста:
    string text = ${controlName}.Text;
    Console.WriteLine($"Введено: {text}");`;
  } else if (eventName === 'CheckedChanged') {
    innerBody = `    // TODO: Реакция на переключение:
    bool isChecked = ${controlName}.Checked;
    Console.WriteLine($"Состояние ${controlName}: {isChecked}");`;
  } else if (eventName === 'SelectedIndexChanged') {
    innerBody = `    // TODO: Обработка выбора элемента:
    var selected = ${controlName}.SelectedItem;
    MessageBox.Show($"Выбран элемент: {selected}", "${controlName}");`;
  } else if (eventName === 'Load') {
    innerBody = `    // TODO: Инициализация данных при запуске формы:
    this.Text += " [Готово]";`;
  } else if (eventName === 'FormClosing') {
    innerBody = `    // TODO: Подтверждение закрытия окна:
    var res = MessageBox.Show("Вы уверены, что хотите выйти?", "Выход", MessageBoxButtons.YesNo);
    if (res == DialogResult.No) e.Cancel = true;`;
  } else {
    innerBody = `    // TODO: Реализация обработчика события ${eventName} для ${controlName}:
    Console.WriteLine("Событие ${eventName} вызвано.");`;
  }

  const signature = eventName === 'FormClosing'
    ? `private void ${handlerName}(object? sender, FormClosingEventArgs e)`
    : eventName === 'KeyDown'
    ? `private void ${handlerName}(object? sender, KeyEventArgs e)`
    : eventName === 'KeyPress'
    ? `private void ${handlerName}(object? sender, KeyPressEventArgs e)`
    : eventName === 'MouseDown' || eventName === 'MouseUp'
    ? `private void ${handlerName}(object? sender, MouseEventArgs e)`
    : `private void ${handlerName}(object? sender, EventArgs e)`;

  return `${signature} {
${innerBody}
}`;
}
