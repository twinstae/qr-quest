import type { Meta, StoryObj } from "@storybook/react-vite";
import { UploadIcon } from "lucide-react";
import { css } from "styled-system/css";

import * as FileUpload from "./file-upload.tsx";

function makeFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

function FileUploadExample(props: FileUpload.RootProps) {
  return (
    <FileUpload.Root {...props} className={css({ width: "320px" })}>
      <FileUpload.HiddenInput />
      <FileUpload.Dropzone className={css({ minHeight: "160px" })}>
        <UploadIcon />
        <p>이미지를 업로드하세요</p>
      </FileUpload.Dropzone>
      <FileUpload.List showSize clearable />
    </FileUpload.Root>
  );
}

const meta = {
  title: "UI/FileUpload",
  component: FileUpload.Root,
  render: (args) => <FileUploadExample {...args} />,
} satisfies Meta<typeof FileUpload.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithFile: Story = {
  args: {
    defaultAcceptedFiles: [makeFile("quest-hint.png", "image/png", 42_000)],
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
