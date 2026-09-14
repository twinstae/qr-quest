import { useId, useState, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input.tsx";
import * as Field from "@/components/ui/field.tsx";
import * as Checkbox from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { getApiClient } from "@/lib/api-client.ts";
import * as FileUpload from "@/components/ui/file-upload.tsx";
import { ImageDown, UploadIcon, XIcon } from "lucide-react";
import { IconButton } from "../ui/icon-button";
import { useFileUploadContext } from "@ark-ui/react/file-upload";
import { css } from "styled-system/css";
import { ALLOWED_IMAGE_TYPE_LABEL, DEFAULT_MAX_IMAGE_BYTES, formatBytes } from "@/domain/upload.ts";
import { compressImage } from "@/lib/compress-image.ts";
import {
  COMPRESS_FAILED_MESSAGE,
  uploadImageFile,
  type UploadIssue,
  type UploadedImage,
} from "@/lib/upload-image.ts";

// export function SimpleDatePicker({ name, label }: { name: string; label: string }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <div>
//           <Label>{label}</Label>
//           <DatePicker
//             name={name}
//             aria-label={label}
//             isInvalid={fieldState.invalid}
//             value={field.value ? parseDate(field.value) : null}
//             onChange={(value) => field.onChange(value?.toString())}
//           />
//           <SimpleErrorMessage name={name} />
//         </div>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

export function SimpleInput({
  name,
  label,
  hint,
  ...props
}: ComponentProps<typeof Input> & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Field.Label>
              {label} {props.required && <Field.RequiredIndicator />}
            </Field.Label>
            <Input
              name={name}
              value={field.value}
              onChange={field.onChange}
              aria-invalid={isError}
              aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
              aria-errormessage={isError ? errorId : undefined}
              {...props}
            />
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

export function SimpleCheckbox({
  name,
  label,
  hint,
  ...props
}: Checkbox.RootProps & { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const isError = !!fieldState.error;

        const errorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        return (
          <Field.Root>
            <Checkbox.Root name={name} value={field.value} onChange={field.onChange}>
              <Checkbox.HiddenInput
                aria-invalid={isError}
                aria-describedby={isError ? errorId : hint ? descriptionId : undefined}
                aria-errormessage={isError ? errorId : undefined}
              />
              <Checkbox.Control aria-invalid={isError}>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                {label} {props.required && <Field.RequiredIndicator />}
              </Checkbox.Label>
            </Checkbox.Root>
            {hint && !isError && <Field.HelperText id={descriptionId}>{hint}</Field.HelperText>}
            {isError && errorMessage && (
              <Field.ErrorText id={errorId} role="alert" aria-label={errorMessage}>
                {errorMessage}
              </Field.ErrorText>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

export type SimpleImageValue = UploadedImage;

// 자동 압축은 긴 변을 단계적으로 줄여가며 두 번까지 시도하고,
// 그 뒤에도 한도를 넘으면 더 작은 사진을 고르게 한다.
const COMPRESS_MAX_EDGES = [1600, 1200] as const;
const MAX_COMPRESS_ATTEMPTS = COMPRESS_MAX_EDGES.length;

// 새로 선택한 파일이 있으면 그 미리보기를, 없으면 기존 값(수정 화면 등)의
// 이미지를 보여준다 — react-hook-form의 field.value와 FileUpload의 내부
// acceptedFiles 상태를 양방향으로 동기화하기 위한 분기.
const FileUploadPreview = ({
  existingValue,
  onRemoveExisting,
}: {
  existingValue: SimpleImageValue | undefined;
  onRemoveExisting: () => void;
}) => {
  const fileUpload = useFileUploadContext();
  const files = fileUpload.acceptedFiles;

  if (files.length > 0) {
    return (
      <FileUpload.ItemGroup>
        {files.map((file) => (
          <FileUpload.Item file={file} key={file.name} p="0.5" w="fit-content">
            {/* 이미지가 아닌 파일(PDF 등)은 미리보기 이미지를 만들 수 없어 예외가 난다. */}
            {file.type.startsWith("image/") ? (
              <FileUpload.ItemPreviewImage />
            ) : (
              <FileUpload.ItemPreview />
            )}
            <FileUpload.ItemDeleteTrigger asChild>
              <IconButton size="2xs" borderRadius="full" pos="absolute" top="-2" right="-2">
                <XIcon />
              </IconButton>
            </FileUpload.ItemDeleteTrigger>
          </FileUpload.Item>
        ))}
      </FileUpload.ItemGroup>
    );
  }

  if (existingValue?.src) {
    return (
      <FileUpload.Dropzone className={css({ minHeight: "160px", p: "0.5" })}>
        <div className={css({ pos: "relative", w: "fit-content" })}>
          <img
            src={existingValue.src}
            alt={existingValue.alt}
            className={css({ maxH: "150px", borderRadius: "sm", display: "block" })}
          />
          <IconButton
            size="2xs"
            borderRadius="full"
            pos="absolute"
            top="-2"
            right="-2"
            onClick={(event) => {
              // Dropzone 클릭 = 파일 선택창 오픈이라 버블링을 막아야 한다.
              event.stopPropagation();
              onRemoveExisting();
            }}
          >
            <XIcon />
          </IconButton>
        </div>
      </FileUpload.Dropzone>
    );
  }

  return (
    <FileUpload.Dropzone className={css({ minHeight: "160px" })}>
      <UploadIcon />
      <p>이미지를 업로드하세요</p>
    </FileUpload.Dropzone>
  );
};

// 업로드만 지원한다 (외부 URL 붙여넣기 없음) — ticket 04 결정 사항.
export function SimpleImageUpload({
  name,
  label,
  hint,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
}) {
  const { control } = useFormContext();
  const [busy, setBusy] = useState<"idle" | "uploading" | "compressing">("idle");
  const [issue, setIssue] = useState<UploadIssue | null>(null);
  const [retry, setRetry] = useState<{ file: File; attempts: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const descriptionId = useId();
  const errorId = useId();

  return (
    <Controller
      render={({ field, fieldState }) => {
        const fieldErrorMessage = fieldState.error?.root?.message ?? fieldState.error?.message;
        const errorMessage = fieldErrorMessage ?? issue?.message;
        const isError = !!errorMessage;

        async function runUpload(
          file: File,
          options: { compressedFrom?: number; attempts?: number } = {},
        ) {
          setIssue(null);
          setNote(null);
          setBusy("uploading");

          const result = await uploadImageFile(file, (input) =>
            getApiClient().uploads.presign.post(input),
          );

          setBusy("idle");

          if (result.status === "uploaded") {
            setRetry(null);
            if (options.compressedFrom != null) {
              setNote(
                `${formatBytes(options.compressedFrom)} → ${formatBytes(file.size)}로 줄여서 올렸어요.`,
              );
            }
            field.onChange(result.image);
            return;
          }

          setIssue(result.issue);
          setRetry(
            result.issue.kind === "too-large" ? { file, attempts: options.attempts ?? 0 } : null,
          );
        }

        async function compressAndUpload() {
          if (!retry) return;

          const source = retry.file;
          const attempts = retry.attempts + 1;

          setBusy("compressing");
          setIssue(null);

          try {
            const maxEdge = COMPRESS_MAX_EDGES[retry.attempts] ?? COMPRESS_MAX_EDGES[0];
            const compressed = await compressImage(source, { maxEdge });
            await runUpload(compressed, { compressedFrom: source.size, attempts });
          } catch {
            setBusy("idle");
            setRetry(null);
            setIssue({ kind: "failed", message: COMPRESS_FAILED_MESSAGE });
          }
        }

        return (
          <Field.Root>
            <Field.Label>
              {label} {required && <Field.RequiredIndicator />}
            </Field.Label>
            <FileUpload.Root
              onFileChange={(details) => {
                setIssue(null);
                setRetry(null);
                setNote(null);

                // 새로 골랐던 파일을 지우면(delete trigger) 폼 값도 함께 비운다.
                // 기존 값 미리보기는 acceptedFiles에 안 들어있으므로 여기서 건드리지 않는다.
                if (details.acceptedFiles.length === 0) {
                  if (field.value?.src) field.onChange(undefined);
                  return;
                }

                // HiddenInput의 change 이벤트로 업로드를 트리거하면 zag-js가 파일
                // 선택 후 내부적으로 input을 다시 동기화하며 change를 한 번 더
                // 발생시켜 같은 파일이 두 번 업로드된다. 대신 라이브러리가 중복
                // 없이 한 번만 호출하는 onFileChange에서 업로드를 트리거한다.
                runUpload(details.acceptedFiles[0]);
              }}
            >
              <FileUpload.HiddenInput
                aria-invalid={isError}
                aria-describedby={isError ? errorId : descriptionId}
                aria-errormessage={isError ? errorId : undefined}
              />
              <FileUploadPreview
                existingValue={field.value}
                onRemoveExisting={() => field.onChange(undefined)}
              />
            </FileUpload.Root>
            {isError ? (
              <Field.ErrorText id={errorId} role="alert">
                {errorMessage}
              </Field.ErrorText>
            ) : (
              <Field.HelperText id={descriptionId}>
                {hint ??
                  `${formatBytes(DEFAULT_MAX_IMAGE_BYTES)} 이하 · ${ALLOWED_IMAGE_TYPE_LABEL}`}
              </Field.HelperText>
            )}
            {issue?.kind === "too-large" &&
              retry &&
              (retry.attempts < MAX_COMPRESS_ATTEMPTS ? (
                <Button
                  size="sm"
                  variant="outline"
                  loading={busy === "compressing"}
                  onClick={compressAndUpload}
                >
                  <ImageDown /> 자동 압축해서 올리기
                </Button>
              ) : (
                <p className={css({ textStyle: "sm", color: "fg.muted" })}>
                  더 작은 사진을 골라 주세요.
                </p>
              ))}
            {note && (
              <p role="status" className={css({ textStyle: "sm", color: "fg.muted" })}>
                {note}
              </p>
            )}
          </Field.Root>
        );
      }}
      control={control}
      name={name}
    />
  );
}

// const defaultRender = (item: SelectItemType) => (
//   <Select.Item
//     id={item.id}
//     supportingText={item.supportingText}
//     isDisabled={item.isDisabled}
//     icon={item.icon}
//     avatarUrl={item.avatarUrl}
//   >
//     {item.label}
//   </Select.Item>
// );

// export function SimpleComboboxWithSelect({
//   name,
//   label,
//   items,
//   ...props
// }: Omit<ComponentProps<typeof Select.ComboBox>, "children"> & {
//   name: string;
//   label: string;
//   items: SelectItemType[];
//   children?: (item: SelectItemType) => ReactNode;
// }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <Select.ComboBox
//           name={name}
//           label={label}
//           items={items}
//           selectedKey={field.value}
//           onSelectionChange={(selectedKey) => {
//             field.onChange(selectedKey);
//           }}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           {...props}
//         >
//           {props.children ?? defaultRender}
//         </Select.ComboBox>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

// export function SimpleSelect({
//   name,
//   label,
//   items,
//   ...props
// }: Omit<ComponentProps<typeof Select>, "children"> & {
//   name: string;
//   label: string;
//   items: SelectItemType[];
//   children?: (item: SelectItemType) => ReactNode;
// }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <Select
//           name={name}
//           aria-label={label}
//           items={items}
//           value={field.value}
//           onChange={field.onChange}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           {...props}
//         >
//           {props.children ?? defaultRender}
//         </Select>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

// export function SimpleInputGroup({
//   name,
//   label,
//   ...props
// }: Omit<ComponentProps<typeof InputGroup>, "children"> & {
//   name: string;
//   label: string;
//   children?: ReactNode;
// }) {
//   const { control } = useFormContext();

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <InputGroup
//           isRequired
//           name={name}
//           label={label}
//           value={field.value?.toString()}
//           onChange={field.onChange}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           {...props}
//         >
//           <InputBase name={name} />
//         </InputGroup>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }

// function parseSafeNumber(input?: string): number | undefined {
//   if (!input) return undefined;

//   // 허용: 음수, 소수점, 숫자만 유지
//   const cleaned = input.replace(/[^0-9.-]/g, "");

//   // 입력 중간 상태는 아직 값으로 확정하지 않음
//   if (cleaned === "-" || cleaned === "." || cleaned === "-." || cleaned === "") {
//     return undefined;
//   }

//   const result = Number(cleaned);

//   invariant(!Number.isNaN(result), "Invalid number input: " + input);
//   return result;
// }

// export function SimpleNumberInputGroup({
//   name,
//   label,
//   shortcut,
//   ...props
// }: Omit<ComponentProps<typeof InputGroup>, "children"> & {
//   name: string;
//   label: string;
//   shortcut?: string | ((value: number) => string);
// }) {
//   const { control } = useFormContext();

//   const render = useCallback(
//     ({ field, fieldState }: Parameters<ComponentProps<typeof Controller>["render"]>[0]) => {
//       const [innerValue, setInnerValue] = React.useState(field.value?.toString() ?? "");

//       React.useEffect(() => {
//         setInnerValue(field.value?.toString() ?? "");
//       }, [field.value]);

//       return (
//         <InputGroup
//           name={name}
//           isRequired
//           label={label}
//           value={innerValue}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           onChange={(value) => {
//             setInnerValue(value.replace(/[^0-9.-]/g, ""));

//             const parsed = parseSafeNumber(value);

//             if (parsed !== undefined) {
//               field.onChange(parsed);
//             }
//           }}
//           {...props}
//         >
//           <InputBase
//             name={name}
//             maxLength={14}
//             shortcut={
//               typeof shortcut === "function"
//                 ? field.value
//                   ? shortcut(field.value)
//                   : undefined
//                 : shortcut
//             }
//           />
//         </InputGroup>
//       );
//     },
//     [name, label, props],
//   );

//   return <Controller control={control} name={name} render={render} />;
// }

// export function SimpleMultiSelect({
//   name,
//   label,
//   items,
//   ...props
// }: Omit<ComponentProps<typeof MultiSelect>, "children" | "selectedItems"> & {
//   name: string;
//   label: string;
//   items: SelectItemType[];
//   children?: (item: SelectItemType) => ReactNode;
// }) {
//   const { control, getValues } = useFormContext();

//   const value = getValues(name);

//   const selectedItems = useListData({
//     initialItems: items.filter((item) => value?.includes(item.id)) as SelectItemType[],
//   });

//   return (
//     <Controller
//       render={({ field, fieldState }) => (
//         <MultiSelect
//           name={name}
//           label={label}
//           selectedItems={selectedItems}
//           isInvalid={fieldState.invalid}
//           hint={fieldState.error?.message}
//           items={items}
//           onItemInserted={(selectedKey) => {
//             field.onChange([...field.value, selectedKey]);
//           }}
//           onItemCleared={(selectedKey) => {
//             const old = field.value;
//             invariant(Array.isArray(old));
//             field.onChange(old.filter((id) => id !== selectedKey));
//           }}
//           {...props}
//         >
//           {(item) => (
//             <MultiSelect.Item id={item.id} label={item.label} isDisabled={item.isDisabled}>
//               {item.label}
//             </MultiSelect.Item>
//           )}
//         </MultiSelect>
//       )}
//       control={control}
//       name={name}
//     />
//   );
// }
