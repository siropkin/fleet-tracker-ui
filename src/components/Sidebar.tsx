/* eslint-disable react-refresh/only-export-components */
import { ElementRef, forwardRef } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
  useDisclosure,
} from '@nextui-org/modal';
import { ModalSlots, SlotsToClasses } from '@nextui-org/theme';
import { HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export interface SheetProps extends Omit<ModalProps, 'placement'> {
  placement?: 'left' | 'right';
}

export const Sidebar = forwardRef<ElementRef<typeof Modal>, SheetProps>(
  ({ placement = 'left', classNames, ...props }, ref) => {
    const extendedClassNames = {
      backdrop: cn(classNames?.backdrop),
      base: cn('!m-0 h-full !rounded-none', classNames?.base),
      body: cn('min-w-[1024px]', classNames?.body),
      closeButton: cn(classNames?.closeButton),
      footer: cn(classNames?.footer),
      header: cn(classNames?.header),
      wrapper: cn(
        placement == 'left' ? 'mr-auto' : placement == 'right' ? 'ml-auto' : '',
        'max-w-fit',
        classNames?.wrapper,
      ),
    } as SlotsToClasses<ModalSlots>;

    const motionProps = {
      variants: {
        enter: {
          x: 0,
          opacity: 1,
          transition: {
            duration: 0.3,
            ease: 'easeOut',
          },
        },
        exit: {
          x: 40,
          opacity: 0,
          transition: {
            duration: 0.2,
            ease: 'easeIn',
          },
        },
      },
    } as HTMLMotionProps<'section'>;

    return (
      <Modal
        ref={ref}
        classNames={extendedClassNames}
        motionProps={motionProps}
        {...props}
      />
    );
  },
);
Sidebar.displayName = 'Sidebar';

export const SidebarBody = ModalBody;

export const SidebarContent = ModalContent;

export const SidebarFooter = ModalFooter;

export const SidebarHeader = ModalHeader;

export { useDisclosure };
